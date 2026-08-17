# FARM FROM HERE — Onboarding Spec B:Username 真身份/真登录 + 头像上传

## Goal
把 Spec A(onboarding 视觉 + sign up 分步)里留作 **stub** 的两个字段接上真后端:
(1) **Username** —— 唯一性校验 + 真能登录;(2) **头像** —— 真实上传到 Supabase Storage。
这是**后端 + 少量前端接线**改动,接在已完成、已合并的 Spec A 之上。

Spec A 已完成:sign up 分 3 步,Step 1 有 Username 框(当时只搭 UI、不校验唯一、不能登录),
Step 3 有头像框(当时只搭 UI、不真上传)。本 spec 把这两处从 stub 变成真。

这是 React Native + Expo 原生 App(iOS + Android,Expo Go 预览),**不是 web/PWA**。
后端 Supabase。忽略任何 Next.js/web 框架念头——以原生为准。

---

## 背景:为什么现在做 Username 登录(不是留到以后)
community 需要 Username 作为真实身份,所以本轮**必然**要写 `username → user` 的查表逻辑。
"Username 登录"缺的就是这一步查表,顺手接通即可,避免以后再进一次 login 后端重测。
因此本 spec **一次做到位**:Username 唯一 + 存储 + **真登录**,login 标识符框三路
(Email / Username / Phone)全部真路由。

---

## Part 1 — Username:唯一性 + 存储 + 真登录

### 1a. Username 规则(落成可执行)
- **唯一性**:全系统唯一。
- **字符**:字母 / 数字 / 下划线(`a-z A-Z 0-9 _`),不允许其他字符。
- **长度**:**3–32 位**(含边界)。
- **大小写不敏感**:`Alice` 与 `alice` 视为同一个。唯一性判断按**小写规范化**进行
  (存一个规范化小写列用于查重/登录;可另存用户原始输入的显示形态,或直接存小写——择一,
  但唯一性与登录一律走小写规范化)。
- **保留字黑名单**:禁止 `admin` / `root` / `system` 等系统保留字。
  **建成可配置的常量数组**(以后能加),初始至少包含:
  `admin, administrator, root, system, support, help, official, farmfromhere, mod, moderator,
  staff, api, null, undefined`。命中黑名单(按小写)则拒绝。
- **命名习惯建议**(真名 / 邮箱前缀 / 简短描述词)只作为 **UI 提示文案**,不做强制校验。

### 1b. 注册时(sign up Step 1 的 Username 框)
- 用户填 Username → 即时/提交前校验:格式(字符+长度)、非保留字、**唯一性**(查库,大小写不敏感)。
  不通过给内联提示,阻止进入下一步。
- 通过则随 profile 存储(存规范化小写 + 可选显示形态)。
- 唯一性检查要处理并发/竞态:数据库层加**唯一约束(基于小写规范化列)**,不要只靠应用层查一次。

### 1c. Username 登录(login 标识符框接通)
login 保持单屏,标识符框仍是 Email / Username / Phone。本 spec 把它变成三路真路由:

**自动判别输入类型(写死这套规则,勿让 CC 另猜):**
- 含 `@` → 当 **email** 处理。
- 纯数字或以 `+` 开头(电话格式)→ 当 **phone** 处理(phone 登录后端本身可仍是 Spec A 遗留的
  stub 状态;若是,保持,不在本 spec 强行接通 SMS)。
- 其余 → 当 **username** 处理。

**Username 登录实现路径:**
- 输入判定为 username → 按小写规范化查 `profiles` 拿到对应用户的 email → 用该 email 走
  Supabase 现有登录。(Supabase 不原生支持用户名登录,故通过"username→email 查表"桥接。)
- 查不到 / 密码错 → 统一友好错误提示,**不要泄露"用户名存在但密码错"这类可枚举信息**
  (登录失败提示对 email/username/phone 三路保持一致措辞)。
- 若某用户是**纯第三方注册**(无密码),用 username + 密码登录本就不该成功 → 给引导性提示
  (如"该账号用第三方登录,请用对应方式登录"),不要报模糊错误。

### 1d. 边界
- **不改** Spec A 已定的 sign up 分步结构、卡片视觉、splash 逻辑。只把 Username 框从 stub 接真。
- **不接通 SMS/phone 后端**(仍是既有 stub);只做 email/username 两路真登录 + phone 判别路由到
  既有 stub。若 phone 已在别处接通,顺其自然,但本 spec 不负责它。

---

## Part 2 — 头像上传到 Supabase Storage

### 2a. Storage
- 头像存 **Supabase Storage**。新建(或复用既有)**头像 bucket**。
  - 头像是**公开可读**的展示资源(community 里别人要看到),与 Step 2 的"申请敏感文件私有
    bucket"是两回事——**头像 bucket 走公开读**,不要放进任何私有/敏感 bucket。
  - 写入受 RLS 限制:用户只能写/改**自己的**头像路径。
- profile 上存头像的引用(storage path 或 public URL 字段;若 Step 1 已有头像字段则复用,
  没有则加一个 additive 列)。

### 2b. 上传流程(sign up Step 3 的头像框接真)
- Step 3 头像框:**选填,可跳过**。跳过 → 使用默认头像(占位)。
- 选图 → 从相机/相册取图(Expo image picker)→ 上传到头像 bucket → 把引用写进 profile。
- 合理压缩/限制尺寸(避免超大原图),具体阈值用可配置常量,拿不准的数值**先问 owner**。
- 上传失败给明确的失败态 + 可重试,**不静默转圈**;失败不阻塞注册完成(头像选填,可事后补)。

### 2c. 事后修改
- 用户之后能在某处(如 profile/设置)更换头像。本 spec 至少保证:头像可上传、可替换、
  community/展示处能读到。若当前没有 profile/设置入口,加一个最小入口即可,不做完整设置页。

---

## Design tokens(沿用,勿另起)
- 暖白 `#F7F4EC`,主绿 `#4C8C4A` / 深绿 `#2F5E3A`(品牌绿,非蓝),圆角 14px,细衬线标题。
- 沿用 Spec A / Step 1 既有 design system 与组件,不新造视觉。

## Affected paths
- `supabase/migrations/`:profiles 加/确认规范化小写 username 列 + 唯一约束;
  (若需)头像引用列;头像 bucket + RLS 策略。
- Username 校验逻辑(格式/保留字/唯一性)+ 保留字可配置常量数组。
- login 标识符自动判别 + username→email 桥接登录。
- sign up Step 1 Username 框:从 stub 接真校验。
- sign up Step 3 头像框:从 stub 接真上传 + 默认头像回退。
- 最小的头像更换入口(若不存在)。
- **不动**:Spec A 的分步结构 / 卡片视觉 / splash;Step 1 其余关系;SMS/phone 后端(仍 stub)。

## When done
1. 注册:Username 走真校验(格式/长度 3–32/保留字/大小写不敏感唯一);重复用户名被拒;
   数据库层有唯一约束防并发。
2. 登录:login 框输 email / username / phone 能被正确判别;email 与 username 两路都能真登录;
   纯第三方账号用 username+密码登录得到引导性提示;错误提示不可枚举。
3. 头像:Step 3 可上传真头像到 Supabase Storage(公开读 bucket,RLS 限本人写),可跳过用默认,
   可事后替换;失败态清晰、不阻塞注册。
4. app 在 Expo Go 跑通。
5. Commit and push,含本 spec 文件 `revise/2026-08-17-onboarding-username-avatar.md`。

## 有疑先问,不要猜
- profiles 是否已有 username / 头像字段可复用,还是需新增 additive 列 → 拿不准问 owner。
- 头像 bucket 是否已存在、命名 → 拿不准问 owner。
- 头像尺寸/压缩阈值的具体数值 → 用可配置常量并标注;关键数值拿不准问 owner。
- 保留字黑名单是否要增删 → 按上面初始集实现即可;如需大改问 owner。
- phone 登录当前是否仍为 stub → 若不确定其状态,保持不动并在提交说明里说明,不擅自接 SMS。
