# 2026-08-17 — Claude Code — 预览模式(不用注册就能逐屏看)

起因：owner 问"我必须每次都要测试吗？能不能出一个版本让我作为管理者随便走每一屏，不想每次都 sign up"。

答案：不用。加了一个开发环境专用的预览模式。

---

## 怎么用

`.env.local` 里已经给你打开了：

```
EXPO_PUBLIC_PREVIEW_MODE=true
```

改了之后要 `npx expo start -c` 重启（`-c` 必须带，Expo 是打包时把 `EXPO_PUBLIC_*` 内联进去的）。

打开 app 后：

- 你已经是"登录状态"，**不需要注册、不需要登录**。
- 每一屏右下角有一个 **PREVIEW · sample data** 药丸，点它打开**屏幕索引**（`/dev`），
  列出全部 7 屏，一点直达：Splash / Login / Sign up / My World / Map / Profile / Setup。
- Login 和 Sign up 也能进（平时已登录会被重定向走，预览模式下不重定向）。

关掉：把那行改成 `false`，或删掉整行。

---

## 为什么它不可能被误发到线上

开关条件是 `__DEV__ && EXPO_PUBLIC_PREVIEW_MODE === 'true'`。

`__DEV__` 在正式包里恒为 false，所以**即使你忘了关那个变量、打了个正式包，它也完全不生效**。
不是靠自觉，是结构上做不到。

---

## 样本数据（你选的方案）

预览模式下这些是假的，全部来自 `src/features/dev/preview.ts`：

- 账号：`Preview Owner` / `@preview_owner` / `preview@example.com`
- 余额：**860 Seeds、1,240 Growth**（这样余额药丸和账本列表都不是空的）
- 账本：几条记录，涵盖注册赠送 / 推荐 / 运动 / 领养扣除
- 农场：**2 个**，名字硬编码成 `PREVIEW — Willow Bend Orchard` 和
  `PREVIEW — Marsh Lane Market Garden`

农场名里带 `PREVIEW` 是刻意的：CLAUDE.md 铁律 6 是"不得把编造的农场数据当成真的"。
名字自带标签 + 常驻的 PREVIEW 药丸，**截图传出去也带着标签**，不可能被误认。

⚠️ **一处措辞瑕疵**：My World 上那句 "2 real farms nearby" 是产品正式文案（生产环境下是对的），
预览模式下这两个农场是假的，所以这句话字面上不准。我没有为了一个开发功能去给生产文案加分支
——那样更糟。PREVIEW 药丸就是那个免责声明。知道即可。

---

## 改了什么

- 新增 `src/features/dev/preview.ts`（开关 + 全部假数据 + 屏幕清单）
- 新增 `src/features/dev/PreviewPill.tsx`（常驻药丸；关掉时渲染 null）
- 新增 `app/dev.tsx`（屏幕索引；没开预览时它会告诉你怎么开）
- `AuthProvider` 顶部短路：预览模式直接给假 session + 假 profile，**其余 auth 代码路径一行没动**
- `useFarms` / `useLedgers`：预览模式返回样本数据
- `app/index.tsx`、`app/(auth)/_layout.tsx`：预览模式下跳过两处会挡路的重定向
- `.env.local.example` 加了这个变量的说明

---

## 验证

- `tsc --noEmit` 干净；iOS + Android 两端 export 正常。
- 实测：药丸出现 → 点开 `/dev` → 跳 My World 显示 **860 Seeds / 1,240 Growth / 2 farms**；
  Profile 显示 `Preview Owner` / `@preview_owner` / 头像占位 + "Add a photo"。
- 关掉开关后 `PreviewPill` 渲染 null、`/dev` 变成说明页——两条路径都试过。

---

## 注意

预览模式**不能替代真机测试**。它证明的是"排版和状态对不对"，不证明后端通不通。
用户名唯一性、头像上传、注册发放 Growth/Seeds 这些**仍然只能靠真 Supabase 项目验证**，
而那个仍然没建。这两件事不要混为一谈。
