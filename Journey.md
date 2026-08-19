# Journey

改动流水账。每次 Claude Code 做完一轮就在**最上面**加一条：日期时间 + 简要改动。

详细的技术交接在 `updates/`，产品规格在 `revise/`。这里只记"什么时候改了什么"。

---

## 2026-08-19 17:14 — Homestead 收尾五件事:字体归一 / 顶部居中切换 / 两个世界都显示余额 / 余额详情页 / day-1 生物槽位

- **① 字体不是各屏乱写,是各屏各挑一套**。所有屏本来就走 `<BrandText>`,但每屏自己挑
  `variant` + `family`,消费者主屏刚好全挑了 Inter,onboarding 和农场卡挑了衬线,于是看着像两个 app。
  改法是加一层**角色层** `src/design/brand/textRoles.ts`(`title` / `lead` / `whisper` / `detail` /
  `kicker` / `hint` / `amount` / `label`),写 `<BrandText textRole="lead">` 就自动拿到对应字体。
  现在全仓 world/farmer/app 屏里 `variant="…" family=` 成对出现的地方为 0。"This is your world."
  已经和农场名同一套衬线。
- **② 顶部切换改成整行居中,两个世界一致,并改名 `Homestead | Grow`**。"Farmer World" 作为可见文案
  已经全仓消失。切换和余额现在是**浮在画布之上的固定两行**,不再挂在某一屏里。内部 key 仍是
  `'my-world'` / `'farmer-world'`,只改可见文案。
- **③ 余额两个世界都显示**。原来它跟着消费者那一屏一起滑走,等于在说"这是消费者的余额"——不对,
  一个人只有一份余额。onboarding 指余额那一步改成子屏上报、画布来发光。
- **④ 点余额进只读的 Seeds / Growth 详情页**(新 `app/(app)/balance.tsx`)。按你选的:**独立页 + 返回键**
  (硬件返回可用、可深链),不是第 6 个底栏 tab;内容是**余额 + 两个账本的最近记录**。
  数据直接用仓里早就写好、但一直没人调用的 `useLedgers` / `describeSource`——没编字段,没动 schema。
  只读是三重的:页面没有任何动作、RLS 只给 SELECT、账本在类型上就是 `ReadOnly<>`,想写都编译不过。
- **⑤ day-1 空状态包进 `Day1CreatureSlot`**,**箱子美术一点没改**,也没有另编空状态美术
  (没有种子、没有地块、没有"认领土地"、没有远处农场)。文件头写明:生物不在这轮做,下一轮把
  `<StarterBox>` 换掉即可,`onPress`(首个生命发放)和 `highlighted`(引导指向)已经接好,生物直接继承。
- ⚠️ **你把底栏第一格也改名了**(spec 默认是保留 "My World" / "My Farm",你选了跟顶部一致 →
  `Homestead` / `Grow`)。onboarding 卡片的 "This is your world" 没跟着改。
- ⚠️ **非农民的右半边仍然是 "Bring yours" 而不是 "Grow"** —— 这一处正是缺失的 gating addendum 要改的,
  等那份 spec 进仓再翻(一个常量)。
- ⚠️ **`revise/2026-08-19-farmer-gating-addendum.md` 到现在仍然不在仓库里**(工作区和 git 历史都没有)。
  这五件事不依赖它,所以照做了;它落地时会碰到的两个点已写在交接里。
- 详见 `updates/2026-08-19_CC_homestead-ui-polish.md`。

## 2026-08-19 16:39 — Farmer World：顶部世界切换 + 竖向滑动 + 农民版底栏

- **先做 Task 1（单独一条 commit）**：消费者底栏改为 `My World | Farm | Quest | Community | Me`，
  只有 Quest 和 Farm 换了位置，图标／文案／路由／页面一个没动。全 app 没有任何按下标索引的
  tab 逻辑，声明顺序就是底栏顺序。已在网页版核对：顺序对、默认还是 My World、`/quest` `/farm`
  深链照常落到各自页面。
- **Task 2：两个世界是同一块竖向画布的上下两屏**。上面是 Farmer World（`farmer-world-background.png`
  的天空 + 幼苗），下面是 My World（沙丘）。底栏固定不动，只有画布在动。
- **`activeWorld` 是唯一真相**：放在 tab 导航器之上的 `WorldModeProvider` 里。画布的位置和底栏
  前两格都由它推导出来，别处不存第二份状态，所以三者不可能对不上。
- **点右半边 = 向上滑，同一件事两个入口**：滑过接缝的那一刻，切换指示和底栏在同一帧里一起翻。
- **农民底栏 `My Farm | Post | Quest | Community | Me`**：一个导航器，每个页面只声明一次，
  **只有第 1、2 格会变**。第 1 格连路由都不换（My World 和 My Farm 是同一块画布的两屏）。
  已在浏览器里验证：切世界时 Quest 那一屏的 DOM 节点是**同一个实例**，没有重挂载、没有分叉。
- **门槛就是一行 `farm_members`，而且失败一律按"不是农民"处理**。纯消费者根本不会挂载农民那一屏、
  不装手势、直接用 URL 进农民路由也会被送回首页；他们点右半边打开的是**申请入口**。
- ⚠️ **Step 2 的农民页面本来就不存在，这轮是占位**：Post / 建地块 / 加认养物 / 编辑农场资料 /
  申请表，都是能点能进、并写明由 `revise/skills/2026-08-17-step2-farmer-portal.md` 哪一节来建的
  占位页。这轮**只做世界切换的壳**，没有重建 Step 2。
- ⚠️ **滑动方向**：spec 里"往上平移进入 Farmer World"（=手指下拉，像地图）和"向上滑"是相反的，
  你选了**向上滑进入 Farmer World**。就一个开关 `SWIPE_UP_ENTERS_FARMER_WORLD`，真机上觉得别扭
  直接翻。
- ⚠️ **标语是占位**，集中在 `FARMER_APPLICATION_COPY` 一个常量里（另加了一条 `toggle: '带上你的'`
  的英文短标签给药丸用，因为药丸放不下整句、又不能对没有农场的人写 "Farmer World"）。
- 预览模式现在**默认是农民**（这样才看得到农民那一侧）；`.env.local` 加
  `EXPO_PUBLIC_PREVIEW_FARMER=false` 可切回纯消费者视角，两边都实测过。
- 详见 `updates/2026-08-19_CC_farmer-world-and-tabs.md`。

## 2026-08-17 20:10 — 修复：预览模式下余额被清零

- 预览模式里任何一次 profile 刷新（下拉刷新、保存资料）都会去查那个占位后端，
  查不到就把假账号写成 null —— 表现为顶部余额变 0、标题从 "Preview's world" 退回 "My World"，
  但下面的账本样本数据还在。
- 修法：`loadProfile()` 在预览模式下直接返回固定 fixture，不再有任何路径能覆盖它。

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
