# Journey

改动流水账。每次 Claude Code 做完一轮就在**最上面**加一条：日期时间 + 简要改动。

详细的技术交接在 `updates/`，产品规格在 `revise/`。这里只记"什么时候改了什么"。

---

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
