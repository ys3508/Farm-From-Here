# FARM FROM HERE — Onboarding 视觉修正 + Sign up 分步重构 (Spec A)

## Goal
把已合并的 onboarding 三屏做三件事:(1) 修正卡片视觉,让全屏插画能被看见;
(2) 把 sign up 从单屏重构成 3 步分步向导 + 进度条;(3) 给 splash 增加"老用户"版
文案 + 登录态分流。**这是纯前端 / 流程改动,接现有后端,不新建后端逻辑。**
Username 唯一性校验、Username 登录、头像上传的真后端属于另一份 spec (Spec B),
本 spec 里这两个字段只搭 UI + stub。

这是 React Native + Expo 原生 App(iOS + Android,Expo Go 预览),**不是 web/PWA**。
后端是 Supabase。若脑中冒出任何 Next.js/web 框架,忽略——以原生为准。

---

## 边界(务必遵守,避免做过头)
- **不动 auth 后端逻辑。** 现有 Email / Phone / 第三方 / Guest 登录注册路由保持不变。
- **Username 框**:本 spec 只搭 UI + 收值,**不做唯一性校验、不做 Username 登录**。
  留清晰 TODO 注释指向 Spec B。注册提交时 Username 可先随 profile 存为普通字符串,
  但**不校验重名**。
- **头像框**:本 spec 只搭 UI(可选、可跳过、显示默认头像占位),**不做真实上传到
  Supabase Storage**。留清晰 TODO 注释指向 Spec B。
- 若本 spec 与既有 design system / 主题文件有冲突,**沿用既有 design system**,不要另起一套。
- 任何本文档没写死、你会去猜的产品规则,**先问 owner,不要自己填空**。

---

## Part 0 — Splash 老用户版(新增)

现有 splash 只有一个版本(新用户,~3.5s 分层淡入,文案 "Your journey begins here"
白色手写体压在插画门下方)。本 spec 增加一个"老用户"版本,并把 splash 时长统一为 3s。

**改动极小,只有以下几点,其余一律不动:**

1. **两版共用同一 splash**:同插画、同分层淡入、同所有文字效果与位置。
   **唯一的内容差异是那一行手写文案**:
   - 新用户 → `Your journey begins here`(不变)
   - 老用户 → `Welcome home :)`(替换该行文案,位置/字体/颜色/白色手写体/动画全部沿用,
     仍压在插画门下方)
2. **时长统一为 3s**(两版都是 3s;原 ~3.5s 调为 3s)。可跳过行为保持现有不变。
3. **哪版给哪种用户 —— 判断依据(方案 A,本地痕迹)**:
   splash 早期在**设备本地**判断有无登录痕迹(已存在的 Supabase session / 本地 token),
   **不等网络、不阻塞启动**。
   - 有登录痕迹 → 老用户版("Welcome home :)")
   - 干净安装 / 已登出 → 新用户版("Your journey begins here")
4. **splash 结束/跳过后的分流**:
   - 老用户(已登录)→ **直接进 My World,不经过 login/signup 屏**。
   - 新用户 → 进 login / signup。

**不要**为老用户版新配动画节奏或新增图层——它就是新用户版换一行字。

---

## Part 1 — 卡片视觉修正(login + signup 两屏都改)

当前问题:白色卡片太大太实,把背景插画盖掉大半(尤其 signup),叙事资产(草地小路、
奔跑的狗)看不见。参考 owner 提供的目标效果:**上半屏全出血插画,下半屏一张半透明
暖白卡片从底部升起、浮在插画上**。

改动:
- **卡片下沉**:顶部露出插画约 **50–55%** 屏幕高度。卡片从屏幕底部升起,仅占下方区域。
- **卡片顶部圆角**(沿用 design token 圆角,若 token 是 14px 则用 14px 或更大的顶部圆角以呼应"升起的纸片")。
- **卡片半透明 + 毛玻璃质感**:背景暖白 `#F7F4EC`,不透明度约 **88–92%**,后面插画隐约透出。
  Expo 下用 `expo-blur` 的 `BlurView` 或半透明背景色实现 frosted 效果,择一,以能跑通为准。
- 卡片不再是死白实心。文字对比度仍要保证可读(标题深绿 `#2F5E3A`,正文深灰绿)。
- `FARM FROM HERE` 品牌字仍压在插画下缘(卡片上方),保持现有细衬线拉字距样式。

login 与 signup **共用这套卡片视觉**。login 卡片内容少,自然矮一点;signup 卡片见 Part 2。

---

## Part 2 — Sign up 分步重构(仅 signup;login 保持单屏不变)

signup 从单屏改为 **3 步分步向导**,卡片顶部加**进度条**,卡片内容超出时**卡片内部滚动**
(插画钉在卡片后方不随内容滚动)。

### 进度条
- **手写极简进度条,不引第三方库。** 严格吃 design system 的绿 + 圆角 token。
- 形态:3 段圆角小条(三个等宽 pill),已完成/当前步填主绿 `#4C8C4A`,未到的步填浅色/描边。
- 放在卡片顶部、标题之上。随步进推进。

### 三步内容

**Step 1 · 创建账号**
- **Have a referral code?**(可折叠,默认收起,选填,可跳过)——沿用现有 referral 折叠 UI。
- **标识符输入框**:仅接受 **Email / Phone**(注意:sign up 标识符**不含** Username;
  这与 login 不同,是故意的)。占位文案写清 "Email or phone"。
- **— 或 — More options**:第三方连接账号(Google / Facebook / X / Apple),沿用现有第三方按钮。
  **走第三方的用户点击后应跳过 Step 2(密码步),直接进 Step 3。**
- **Username**(UI 标必填;本 spec 仅收值,不校验唯一——见边界)。
- **[继续]** 按钮。
- **每步即时校验**:Email 格式 / Phone 格式不合法时,不允许点"继续"并给内联提示。
  Username 本 spec 只校验"非空",不校验唯一。

**Step 2 · 设密码**
- **仅 Email/Phone 注册路径进入本步。第三方路径跳过本步。**
- 密码 + 确认密码,两者一致才可继续。内联校验。
- **[返回]** / **[继续]** 按钮。

**Step 3 · 完善资料(所有注册路径最终都到这)**
- **真实姓名**(手填)。第三方注册的用户也在此步**弹框/字段补填真实姓名**
  (不要假设第三方会自动带回姓名)。
- **头像**(选填,可跳过,显示默认头像占位)——本 spec 仅搭 UI,不做真实上传(见边界)。
- **[返回]** / **[创建账号]** 按钮。
- 点"创建账号"完成注册,走**现有后端注册逻辑**。注册完成后,若存在有效 referral 关系,
  按现有 `seeds_ledger` 逻辑发放**双方各 500 Seeds**(此逻辑 Step 1 已实现,复用即可,勿重写)。

### 路径分叉小结(务必实现正确)
```
Email/Phone 路径:  Step 1 → Step 2(密码) → Step 3(资料) → 创建
第三方路径:        Step 1 → (跳过 Step 2)  → Step 3(资料) → 创建
```
进度条对第三方用户应正确反映"跳过一步"(仍显示 3 段,或在第三方路径下第 2 段直接置为已完成/跳过——择一实现,以视觉不困惑为准)。

---

## Login(不改流程,仅套用 Part 1 卡片视觉)
- 保持**单屏**:标识符框(Email / Username / Phone)+ 密码 + Log in。
- More options(第三方)保持现有折叠。
- Guest 只读入口保持。
- **注意**:login 标识符框仍写 Email/Username/Phone。其中 Username 登录本 spec 仍是 stub
  (真路由在 Spec B),保持现状即可,不要在本 spec 里动它。

---

## Design tokens(已锁定,严格遵守)
- 底色暖白 `#F7F4EC`
- 主绿 `#4C8C4A` / 深绿 `#2F5E3A`(品牌色是绿,不是蓝——任何默认蓝一律替换)
- display 用优雅细衬线、拉字距;手写体那行(如 "Your journey begins here")白色
- 圆角 14px(卡片顶部圆角可等于或大于此值以呼应"升起的纸片"感)
- 沿用既有 design system 组件,不另起炉灶

---

## Affected paths
- onboarding 三屏(splash / login / signup)的组件与样式
- 新增手写进度条组件(放进共享 UI / design-system 目录)
- 卡片容器组件(login 与 signup 共用的半透明卡片)
- sign up 分步状态管理(step 1/2/3 + 路径分叉)
- **不动**:`supabase/` 后端、auth 路由、`seeds_ledger` / referral 逻辑

## When done
1. 验证:splash 老用户版显示 "Welcome home :)"、新用户版显示 "Your journey begins here",
   两版都 3s、可跳过、其余效果一致;老用户(有本地登录痕迹)跳过后直接进 My World、
   不经 login,新用户进 login/signup;login 与 signup 都能看见背景插画(卡片露出插画
   ~50–55%);signup 走完 3 步(Email/Phone 路径经密码步、第三方路径跳过密码步),
   两条路径都能建号成功;referral 双方各 500 Seeds 仍按现有逻辑发放;进度条随步推进;
   app 在 Expo Go 跑通。
2. Username 框与头像框为 UI + stub,带清晰 TODO 注释指向后续 Spec B。
3. Commit and push,把本 spec 文件 `revise/2026-08-17-onboarding-visual-and-signup-steps.md`
   一并 commit。

## 有疑先问,不要猜
- 若既有 design system 已有卡片/进度条相近组件,是否复用 → 倾向复用,拿不准问 owner。
- frosted 效果用 `expo-blur` 还是半透明色 → 择能跑通者,拿不准问 owner。
- 进度条在第三方"跳过密码步"时的视觉表现 → 若两种实现都可,选不困惑用户的那种;拿不准问 owner。
