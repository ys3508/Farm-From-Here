# 2026-08-17 — Claude Code — Spec B:Username 真身份/真登录 + 头像上传

来源 `revise/2026-08-17-onboarding-username-avatar.md`。
把 Spec A 里留作 stub 的两个字段接上真后端。**Spec A 的分步结构 / 卡片视觉 / splash 一律未动，
SMS 未接。**

---

## 1. 做了什么

### Username — 唯一性 + 存储 + 真登录
- 新增迁移 `20260817000700_username_and_avatars.sql`：
  - `profiles.username` 列（additive）。
  - **格式约束**：`^[A-Za-z0-9_]{3,32}$`，数据库层 CHECK。
  - **保留字约束**：`is_reserved_username()` 函数 + CHECK，命中即拒。函数体就是那份可配置数组，
    以后加词写一条新迁移重定义即可。
  - **大小写不敏感唯一**：`create unique index ... on profiles (lower(username))`。
    用表达式索引而不是再开一个小写列——只有一列，两份值就没有机会漂移，
    并发抢注也只能有一个成功。
- `is_username_available(text)` RPC：注册表单用它做即时查重。必须 SECURITY DEFINER，
  因为 RLS 不让用户读别人的 profile，普通查询会把所有已占用的名字都报成"可用"。
- 注册时 username 的写入路径分两条：
  - **邮箱注册**：开了邮件确认就没有 session，客户端写不了 profiles。所以 username 随
    auth metadata 走，由新触发器 `apply_username_from_metadata()` 在 profile 建好后拷进去。
    没有去改 `handle_new_user`——那要把整段函数体在新迁移里重抄一遍，两份注册发放逻辑迟早漂移。
  - **第三方注册**：已有 session，`saveProfileDetails()` 直接写 `profiles.username`。
- **登录三路真路由**：login 单一输入框，`signInWithIdentifier()` 判别后分发。
  username 经 `email_for_username()` 换成 email 再走既有登录。

### 头像 — 真实上传
- 新建 **公开读** 的 `avatars` bucket；写入 RLS 限制为**路径第一段必须是自己的 user id**。
- 复用 Step 1 已有的 `profiles.avatar_url` 列（**不新增列**），但里面存的是
  **storage path 而不是绝对 URL**——绝对 URL 写死了 project ref，项目迁移/恢复后全部失效。
  URL 由 `avatarPublicUrl()` 在读取时拼。列上加了 comment 说明。
- 上传前在设备上先缩放 + 重编码（1024 / 质量 0.85 / 上限 5MB，你定的值，在 `src/config/media.ts`）。
  8MB 原图不会跨网络。
- 选图用 `allowsEditing + aspect [1,1]`，由用户自己裁——不猜他脸在哪。
- **失败不阻塞注册**：头像是选填的，上传失败会明确告知并可事后补，不会让人丢账号。
- 事后更换入口做在 **profile 屏**（头像可点 + "Change photo"），没有做完整设置页。

---

## 2. ⚠️ 上线前必须解决的一件事（你已知悉并选择先这样）

`email_for_username()` 这个 RPC **未登录就能调**，因为登录本来就发生在登录之前。这意味着：

> **任何人拿一个用户名就能查到对应的邮箱地址。**拿一份用户名列表就能批量收邮箱。

你在 2026-08-17 选择"先按 spec 实现、代码里大写标注"。已经这么做了：迁移文件里有一整块
`🚧 BLOCKER BEFORE PUBLIC LAUNCH` 警告，types.ts 里也有。

**已做的损害控制**：该函数只接受一个精确用户名、最多返回一行，**不能列举、不能前缀匹配、不能翻页**——
是查询，不是导出。

**正确的修法**（上线前）：改成 Edge Function，接 username + 密码，用 service role 在服务端查表并
完成登录，只回传 session，邮箱永不下发。然后删掉这个函数并收回 anon 的执行权限。

---

## 3. 给 Sissi — 其它需要知道的

**登录失败提示三路统一**，实测 username 和 email 失败时是**逐字相同**的一句
"Those details did not match an account."——不会泄露"这个用户名存在但密码错"。

**唯一例外**：用户名对应的账号完全没有密码（纯第三方注册）时，会给一句
"This account signs in with Google, Facebook, X or Apple."。这是 spec 明确要求的引导性提示；
它确实比统一措辞多说了一点，但没有它，一个 Google 用户会永远重试密码而不知道为什么。

**注册时选了头像但邮件确认没关**：此时没有 session，没有账号能拥有那个文件，所以头像不会上传，
会明确提示"确认邮箱后到个人页添加"。邮件确认关闭时（开发常见）注册即有 session，头像会正常上传。

**手机号仍是 stub**，一个字没动。login 输入手机号会被判别为 phone 并给出"尚未接通"提示。

---

## 4. 给其他 agent

- **username 的唯一权威是数据库**（表达式唯一索引）。`src/features/auth/username.ts` 只是为了
  即时提示，**改一处必须改两处**（另一处在迁移里）。
- `profiles.avatar_url` 存 **path**，不是 URL。读的时候一律走 `avatarPublicUrl()`。
- 头像 bucket 的授权靠**路径第一段 = user id**，路径格式 `avatars/<profile_id>/<ts>.jpg`。
  改路径规则等于改授权规则。
- `PHONE_STUB_MESSAGE` 现在是模块级常量，被单独入口和标识符路由共用，别再各写一份。
- `signUpWithEmail` 现在返回 `{ userId, hasSession }`。`hasSession` 为假时**不要**试图写任何
  属于该账号的东西——RLS 会拒。

---

## 5. 验证情况（重要：分清验过和没验过）

**已验证**
- `tsc --noEmit` 干净；iOS + Android 两端都能 export。
- 全部 8 个迁移文件通过真实 Postgres 语法解析。
- 注册 Step 1 的 username 校验，四种情况实测给出正确内联提示：
  太短 / 保留字 / 非法字符 / 标识符不是邮箱或手机。
- login 三路判别实测：手机 → stub 提示；username 与 email → **逐字相同**的失败措辞。

**未验证 —— 需要真数据库**
- username 唯一性、并发抢注、触发器拷贝 metadata：**从未执行过**。
- `email_for_username` / `is_username_available` 两个 RPC：**从未执行过**。
- 头像上传、bucket 策略、公开读 URL：**从未执行过**，本机没有 Supabase 项目也没有 Storage。
- 语法解析查不出 catalog 错误（比如触发器里引用了不存在的列）。

这仍然是 Step 1 就存在的那个头号风险：**迁移一次都没真正跑过。**

---

## 6. To-do

1. 建 Supabase 项目 + 按顺序跑 8 个迁移（仍是最大阻塞项）。
2. 跑通后端到端测一遍：注册占用一个用户名 → 用它登录 → 用另一个账号抢同名（应被拒）→
   传一张头像 → 在 profile 页换一张。
3. **上线前**把 `email_for_username` 换成 Edge Function（见 §2）。
4. 手机号 / SMS，等你愿意为 Twilio 付费时。
