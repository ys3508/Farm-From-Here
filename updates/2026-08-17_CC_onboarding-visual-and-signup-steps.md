# 2026-08-17 — Claude Code — Onboarding 视觉修正 + Sign up 分步重构 (Spec A)

来源 `revise/2026-08-17-onboarding-visual-and-signup-steps.md`。
**纯前端 / 流程改动。`supabase/` 一个字节没动，auth 路由和 seeds_ledger / referral 逻辑未改。**

---

## 1. 做了什么

### Part 0 — Splash 合并成一屏两版
- **删掉了独立的 `app/welcome-back.tsx`**，两版共用 `app/splash.tsx` 和同一张 `splash.png`，
  同动画、同位置、同字体，**唯一差异就是那行手写字**。
- 新用户 `Your journey begins here` / 老用户 `Welcome home :)`，两版都 **3s**，都可点击跳过。
- 判断依据是**设备本地痕迹**（`src/features/auth/localSession.ts` 读 AsyncStorage 里的
  `sb-*-auth-token`），不发网络请求、不阻塞启动。
- 分流交给 `app/index.tsx`：splash 结束 → 已登录直接进 My World（不经 login），未登录进 login。
  **注意**：选哪行字用本地痕迹，但**真正的分流用真实 session** —— 磁盘上一个过期 token
  不应该足以把人放进 app。

### Part 1 修订（同日追加）— 插画完整显示，不再被卡片盖住
初版做成了「插画满屏铺底 + 卡片压在上面」，owner 指出这不是本意：
**要看到整张图，而不是图被裁切、下半截藏在卡片后面。**

- 新增 `OnboardingStage`：上方 52% 是插画专属区域，`resizeMode="contain"`，**整张图完整可见、
  一分不裁**；卡片从图的下沿开始，占剩下的 48%，**不覆盖插画**。
- owner 选择「保持 52/48 比例」而非「满宽不留白」，所以竖构图的画在横向装不满，
  左右会出现暖白留白 —— 这是这个选择必然的几何后果，不是 bug。
- 品牌字 `FARM FROM HERE` 被**限制在图片实际渲染宽度内**，白字永远不会飘到米白留白上变成看不见。
- ⚠️ **两张图的留白宽度不一样**（见下方「需要你决定」）。
- splash 不受影响，仍是满屏出血。

### Part 1 — 卡片下沉 + 半透明
- `ScrimCard` 从"居中白盒"改成**从底部升起的暖白纸片**：底部吸附、顶部圆角 28、
  最大高度 = 屏高 × 48%，**插画固定露出 52%**。
- 半透明 `rgba(247,244,236,0.90)` + `expo-blur` 毛玻璃（iOS/Android）。web 上 BlurView 支持不稳，
  所以底色本身就够读——**不把可读性押在 blur 上**。
- 卡片内容**在卡片内部滚动**，插画钉在后面不动。
- login 和 signup 共用这一个组件。

### Part 2 — Sign up 三步向导
- 新增 `StepProgress`（手写三段圆角 pill，不引第三方库）。
- Step 1 建账号：referral 折叠（默认收起）+ 标识符（**仅 Email/Phone，不含 username**）+
  Username + Continue + 折叠的第三方按钮。
- Step 2 设密码：密码 + 确认，Back / Continue。
- Step 3 完善资料：头像占位 + 真实姓名，Back / Create account。
- **第三方路径跳过 Step 2**，进度条第 2 段直接显示为已完成（不会让人以为还有一步没做）。

### login
流程完全没动，只套用了新卡片视觉。

---

## 2. 给 Sissi — 需要知道的

**两个问题你已经拍板了**：两版 splash 共用 `splash.png`（`welcome.png` 文件保留在仓库里，
暂时不再被引用，以后想用随时接回）；第三方用户在 Step 3 弃填就是资料不全，不强制补。

**Username 没有存进 `profiles`，存进了 auth metadata。** spec 里写"可先随 profile 存"，
但 `profiles` 根本没有 `username` 列，加列 = 迁移 = 碰后端，而边界写死了不许碰。
所以它被存在 `auth.users.raw_user_meta_data.username`。值是安全的、位置是固定的，
**Spec B 加列时一条 SQL 就能回填**。代码里有 TODO 指向 Spec B。
按 spec 要求：**不校验重名、不能用 username 登录**。

**手机号注册在 Step 1 就被拦下了。** 标识符框接受 Email/Phone，但 SMS 后端是 Step 1 留的存根，
根本走不完。与其让人填完三步再失败，不如在第一步就说清楚"手机注册尚未接通，请先用邮箱"。
这是我的判断，不是 spec 写的——**如果你希望它放行到最后一步再报错，说一声**。

**第三方注册的时序**：点第三方按钮那一刻账号就建好了（初始 Growth/Seeds、推荐奖励全部已发放），
Step 3 的"创建账号"实际是"补全资料"。为了不让人被踢出向导，
`(auth)/_layout.tsx` 在向导进行中会跳过"已登录就重定向"这条规则。

**Referral 逻辑一行没改**，仍是 Step 1 的：双方各 500 Seeds，走 `seeds_ledger`，
只在账号真正建成后发放。

**头像只有 UI**，点"Add a photo"会说明上传下版接入。没有任何真实上传。

---

## 2b. ⚠️ 需要你决定 — 两张插画的宽高比不一致

因为选了「完整显示 + 保持 52/48」，图在横向装不满，左右留白宽度**由这张图本身的宽高比决定**。
两张图的比例差很多，所以两屏看起来不一致（实测，375×812）：

| 屏 | 素材尺寸 | 宽高比 | 实际画出宽度 | 每侧留白 | 品牌字 |
|---|---|---|---|---|---|
| login | 1086×1448 | 0.75 | 316pt | **29pt** | 一行 |
| signup | 941×1672 | 0.56 | 238pt | **69pt** | **折成两行** |

signup 那张明显更窄更高，于是留白宽了一倍多，品牌字也因为被限制在图宽内而折成
`FARM FROM` / `HERE` 两行 —— 而 login 是一行。**两屏并排看会觉得不是一套。**

代码这边没法在不违反你选择的前提下解决（拉伸会变形，裁切你已经否掉了）。真正的修法是
**把 signup-bg 重新导出成和其它三张一致的比例**（splash / welcome 都是 1024×1536 = 0.667，
login 是 0.75）。统一到 0.667 左右，两屏的留白和品牌字就会一致。

在你重导之前，现在这个状态是能用的，只是不够整齐。

## 3. 给其他 agent — 构建注意事项

- login / signup 用 `OnboardingStage`（插画占上方 52%，卡片接在下面用 `fillRemaining`）。
  splash 用 `SceneBackground`（满屏出血）。两者不要混用。
- `scenes` 里**记录了每张图的原始像素尺寸**。`Image.resolveAssetSource` 在 react-native-web 上
  不存在，expo-asset 又不是直接依赖，所以没有一个跨端的运行时办法问图片有多大。
  **换图必须同时改那里的数字**——它决定图渲染多宽，进而决定品牌字最多能多宽。
- `ScrimCard` 独立使用时用 `scrim.revealFraction` 算 `maxHeight`；在 `OnboardingStage` 里用
  `fillRemaining` 取剩余高度。不要在页面里写死卡片高度。
- `onboardingSequence.beginProfileSetup()` / `endProfileSetup()` 是**第三方注册能走完三步的唯一原因**。
  删掉它，OAuth 用户会在 Step 1 点完按钮后被直接甩进 My World。
- `hasLocalSessionTrace()` 只用来选文案，**不要拿它当登录状态判断**。真实状态用
  `useAuth().session`。
- `saveProfileDetails()` 写 `profiles.display_name`（RLS 已允许改自己的 profile）+
  auth metadata 里的 username。它不建账号——第三方路径下账号早就存在了。
- web 控制台的 `useNativeDriver`、`shadow*`、`textShadow*` 警告都是 react-native-web 独有的，
  原生端不出现。

---

## 4. 验证

- `tsc --noEmit` 干净；iOS + Android 两端 bundle 都能 export。
- 三步向导逐步走通：进度条 1/3 → 2/3 → 3/3 依次变绿，字段与按钮正确。
- 卡片实测 `top = 422 / 812 = 52%`，底色实测 `rgba(247,244,236,0.9)`。
- 插画完整显示实测：两屏都是 52/48，login 画出 316pt、signup 238pt，均未裁切。
- login 卡片标题改为 `Good to see you`（`Welcome back` 让给老用户开屏的语气）。
- splash 两版实测：有本地痕迹 → `Welcome home :)`；清掉痕迹 → `Your journey begins here`。
- ⚠️ **仍未真机验证**：Supabase 项目还没建、migration 还没跑，所以"点 Create account 真的建出账号"
  这一步**没有被端到端验证过**。这仍是 Step 1 遗留的头号未验证项。

---

## 5. To-do

1. 建 Supabase 项目 + 跑 migration（仍是最大阻塞项）。
2. 在 Expo Go 里看看卡片 52% 的露出比例和毛玻璃强度（`intensity={28}`）合不合适——都是一行改动。
3. Spec B：username 唯一性 + username 登录 + 头像真实上传。
4. 决定手机号注册是否要放行到最后一步再报错。
5. **重导 `signup-bg.png` 到和其它三张一致的宽高比**，消除两屏留白与品牌字折行的不一致（见 §2b）。
