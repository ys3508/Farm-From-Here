# Journey

改动流水账。每次 Claude Code 做完一轮就在**最上面**加一条：日期时间 + 简要改动。

详细的技术交接在 `updates/`，产品规格在 `revise/`。这里只记"什么时候改了什么"。

---

## 2026-08-17 19:50 — 预览模式（不用注册就能逐屏看）

- `.env.local` 里 `EXPO_PUBLIC_PREVIEW_MODE=true`（已给你打开），重启后即为"已登录"状态，
  **不需要注册也不需要登录**。
- 每屏右下角常驻 **PREVIEW · sample data** 药丸，点开 `/dev` 屏幕索引，7 屏一点直达
  （含平时进不去的 Login / Sign up）。
- 样本数据：860 Seeds / 1,240 Growth / 几条账本 / 2 个名字带 `PREVIEW` 前缀的假农场。
- **正式包里不可能生效**：开关是 `__DEV__ && 环境变量`，`__DEV__` 在正式包恒为 false。
- AuthProvider 只在顶部短路，其余 auth 逻辑一行没动。
- ⚠️ 预览模式不能替代真机测试——它验排版，不验后端。
- 详见 `updates/2026-08-17_CC_preview-mode.md`。

## 2026-08-17 19:15 — Spec B：Username 真身份/真登录 + 头像上传

- **Username 接真**：新增迁移 `20260817000700`，`profiles.username` + 格式/保留字 CHECK +
  **大小写不敏感唯一索引**（表达式索引，不另开小写列）。注册表单走 `is_username_available()`
  即时查重；邮箱注册经 metadata + 触发器写入，第三方注册直接写 profile。
- **登录三路真路由**：login 单一输入框判别 email / username / phone。username 经
  `email_for_username()` 换 email 再登录。失败措辞三路统一，不可枚举。
- **头像接真**：新建公开读 `avatars` bucket，写入 RLS 限本人路径；设备端先缩放重编码
  （1024 / 0.85 / 5MB）。复用 `profiles.avatar_url`，里面存 **path 不是 URL**。
  profile 页可事后更换。上传失败不阻塞注册。
- 手机 / SMS **未接**，仍是 stub。Spec A 的分步结构 / 卡片视觉 / splash **未动**。
- ⚠️ **上线前阻塞项**：`email_for_username` 未登录即可调，任何人能用用户名查出邮箱。
  已在迁移里大写标注，上线前须改成 Edge Function。
- ⚠️ 唯一性 / RPC / 头像上传**都未真正执行过**——本机仍无 Supabase 项目。
- 详见 `updates/2026-08-17_CC_username-and-avatar.md`。

## 2026-08-17 18:25 — 归档两份产品文档（无代码改动）

- `revise/2026-08-17-step2-farmer-portal.md` 更新：新增农民双档 `individual` / `verified_farm`、
  申请材料与审核路径，以及"诚实信任模型"（个体户对外称 Community grower，
  "Verified" 只留给通过人工审核的正式农场）。注册流程不分叉。
- `revise/2026-08-17-myworld-grove-direction-brief.md` 新增：My World / GROVE 方向简报，
  **存档性质、未路由**，供 onboarding 收尾后拆实现 spec 用。

## 2026-08-17 18:10 — 去掉品牌字 + 两屏插画留白统一

- **login 与 signup 去掉 `FARM FROM HERE` 品牌字**（只保留在 splash）。
- **两屏插画留白统一**：所有 onboarding 插画按同一宽度绘制（屏宽 84%，每侧留白 8%），
  **长宽比不变**，放大后**底部对齐**，多出的部分从**顶部**裁掉 —— 小狗和小路一定在画面里。
  实测两屏都是左边距 30pt、画出宽度 315pt、卡片起点 422（52%）。
- 上一条记录里「建议重导 signup-bg」的遗留问题就此解决，**素材不用改**。

## 2026-08-17 17:40 — 插画完整显示 + 登录标题

- **插画不再被卡片盖住**：新增 `OnboardingStage`，上方 52% 是插画专属区，整张图完整显示、
  一分不裁；卡片接在图的下沿，占剩下 48%，不覆盖插画。splash 仍是满屏出血。
- 保持 52/48 比例（owner 选择），因此竖构图左右会有暖白留白；品牌字被限制在图的实际宽度内，
  白字不会飘到留白上。
- 登录卡片标题 `Welcome back` → `Good to see you`（`Welcome back` 的语气留给老用户开屏）。
- ⚠️ 遗留：`signup-bg.png` 比其它三张窄很多（0.56 vs 0.67/0.75），留白宽一倍、品牌字折两行，
  两屏看着不是一套。建议重导该图统一比例，详见 updates 的 §2b。

## 2026-08-17 17:05 — Onboarding 视觉修正 + Sign up 分步重构（Spec A）

- **Splash 合并成一屏两版**：删掉独立的 `welcome-back` 屏，两版共用同一张插画与动画，
  只有那行手写字不同（新用户 `Your journey begins here` / 老用户 `Welcome home :)`），
  统一 3s、可跳过。判断用设备本地痕迹，不发网络请求。
- **分流**：splash 结束后已登录直接进 My World，不再经过 login。
- **卡片下沉**：`ScrimCard` 改成从底部升起的半透明暖白纸片（顶部圆角 28、
  插画固定露出 52%、`expo-blur` 毛玻璃、内容在卡内滚动）。login 与 signup 共用。
- **Sign up 改成 3 步向导** + 新增 `StepProgress` 手写三段进度条。
  第三方路径跳过密码步，进度条第 2 段显示为已完成。
- Username 与头像**只有 UI + stub**，TODO 指向 Spec B。Username 存在 auth metadata，
  因为 `profiles` 还没有该列且本轮不许改后端。
- login 流程未动，只换卡片视觉。
- 后端 / auth 路由 / referral 逻辑**未改动**。
- 详见 `updates/2026-08-17_CC_onboarding-visual-and-signup-steps.md`。

## 2026-08-17 12:50 — 加入 Journey.md

- 新增本文件，以后每轮改动记在这里。
- 约定：不再自动改 `README.md`。

## 2026-08-17 12:36 — Onboarding 视觉重做（commit `5da9c26`）

- 新增 brand 设计系统 `src/design/brand/`：9 色配色、圆角 14、Cormorant / Inter / Dancing Script，
  以及 BrandText / BrandButton / BrandField / ScrimCard / Collapsible / SceneBackground。
  **本轮只作用于 onboarding**，My World / 地图 / 个人页维持原样。
- 新增开屏 `app/splash.tsx`（约 3.5s，未登录才看）。
- 新增 Welcome Back `app/welcome-back.tsx`（约 2s，老用户，和开屏共用同一组件）。
- 重做登录 `app/(auth)/sign-in.tsx`：单一输入框（邮箱/用户名/手机）+ 半透明白卡。
- 新增注册 `app/(auth)/sign-up.tsx`：推荐码行默认收起，放在卡片顶部。
- 四张手绘插画进 `assets/onboarding/`，母版留在 `ui_design/onboarding/`。
- 删除 `app/(auth)/email.tsx`、`app/(auth)/phone.tsx`，功能并入新登录/注册屏。
- 修复：背景图在 web 上按原始尺寸 1086×1448 排版导致画面放大偏心。
- 修复：登录成功后会误播"Welcome Back"屏。
- 修复：`.claude/launch.json` 端口写成 3000、起的是原生 dev server。
- 后端、schema、auth 逻辑**未改动**。
- 详见 `updates/2026-08-17_CC_onboarding-redesign.md`。

## 2026-08-17 02:22 — Step 1 地基（commit `f5af3c5`）

- 从纯文档仓库变成可运行的 Expo app（SDK 57，iOS + Android）。
- 数据库：6 个 migration、27 张表。核心链路 profiles → farms → plots → adoptables → adoptions，
  plot_updates 按 plot 扇出，双 ledger，referrals。
- 两套经济在**数据库层**强制：余额只能经 ledger 变动，ledger 只增不改，客户端无法凭空造 Seeds。
- Auth 七个入口（邮箱 / 手机存根 / Google / Facebook / X / Apple / 游客）+ 推荐码。
- 注册触发器：建 profile、发推荐码、发初始 Growth/Seeds、结算推荐奖励（双方各 500 Seeds）。
- 初版设计系统 `src/design/`、My World 仪表盘、风格化地图。
- ⚠️ migration **尚未真正执行过**（本机没有 Supabase CLI / Docker / psql），只做了 Postgres 语法解析。
- 详见 `updates/2026-08-17_CC_step1-foundation.md`。
