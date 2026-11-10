# 新增主题与交互页操作手册

本手册面向内容作者。例子使用主题 `caching`、讲解 `read-path`；为已有主题加页面时，直接从第二部分开始。所有命令在仓库根目录执行。

用户只需用自然语言提出要求，Agent 必须按 AGENTS.md 自动读取并执行本手册。以下文件操作由 Agent 完成，用户不必手动跟做。通过 Paseo remote 交付时，还须按 [公网预览手册](remote-preview.md) 提供实际可访问的公网链接。

## 准备环境

使用 Node.js 24 和 pnpm 11.5.2；pnpm 版本以 package.json 的 packageManager 为准。[pnpm 安装说明](https://pnpm.io/installation)。

```sh
nvm use
pnpm install --frozen-lockfile
pnpm dev
```

浏览器打开终端输出的 `/learnbycode/`。英文首页为 `/learnbycode/en/`。保持 dev 进程运行；修改交互源文件或文案后，在另一个终端执行 `pnpm render` 并刷新。Astro 的目录和布局文件支持热更新。

## 一、新增一个内容主题

创建 `src/content/topics/caching.json`：

```json
{
  "title": { "zh": "缓存如何工作", "en": "How caches work" },
  "subtitle": { "zh": "从命中与失效开始", "en": "Start with hits and misses" },
  "description": {
    "zh": "通过可操作图解理解缓存读取路径。",
    "en": "Explore cache read paths through interactive diagrams."
  },
  "order": 2,
  "tags": { "zh": ["系统设计"], "en": ["System design"] },
  "lessons": []
}
```

文件名就是主题 slug。只用小写字母、数字与单个连字符，不建子目录，不使用中文路径。`order` 决定首页排序；title、subtitle、description、tags 都须提供两种语言。

保存后，首页和主题目录会自动收录，并生成：

```text
/learnbycode/topics/caching/
/learnbycode/en/topics/caching/
```

不需要手动添加 Astro 路由或首页链接。`pnpm check` 检查元数据；`pnpm build` 检查最终链接。

## 二、给主题新增一篇交互讲解

先在该主题 JSON 的 `lessons` 数组添加一项：

```json
{
  "slug": "read-path",
  "title": { "zh": "一次读取如何经过缓存", "en": "How a read passes through a cache" },
  "description": { "zh": "对比命中和未命中的路径。", "en": "Compare hit and miss paths." },
  "status": "planned",
  "minutes": 5
}
```

`planned` 只展示计划，不生成可点击链接，适合尚未完成的内容。同一主题下 slug 不可重复。给已有主题新增页面也执行这一步，例如编辑 superagent.json；不需要创建新主题。

一篇讲解由三个同名文件组成：

```text
explainers/caching/read-path/
  read-path.src.html     共享布局、图形与翻译占位符
  read-path.copy.json    中英文静态文案及动态解释
  read-path.ts           两种语言共用的交互逻辑
```

可以从现有页面复制骨架：

```sh
mkdir -p explainers/caching/read-path
cp explainers/superagent/routing/routing.src.html explainers/caching/read-path/read-path.src.html
cp explainers/superagent/routing/routing.copy.json explainers/caching/read-path/read-path.copy.json
cp explainers/superagent/routing/routing.ts explainers/caching/read-path/read-path.ts
```

随后将 `read-path.ts` 的导入改为 `./read-path.copy.json`。**复制只是骨架：应重写图形、场景、解释、来源与 commit，不能把原页面的 Agent 源码依据留在缓存主题中。** 在核对完成之前保留 planned。

## 三、维护双语 HTML

源文件通过占位符读取文案，例如：

```html
<html lang="{{HTML_LANG}}" data-register="blueprint">
<head>
  <title>{{t:pageTitle}}</title>
  <link rel="canonical" href="{{PAGE_URL}}">
  <link rel="alternate" hreflang="zh-CN" href="{{ZH_URL}}">
  <link rel="alternate" hreflang="en" href="{{EN_URL}}">
  <link rel="stylesheet" href="kit.css" data-ve-kit>
</head>
<body>
  <a href="{{TOPIC_URL}}">{{t:back}}</a>
  <a data-language-switch href="{{OTHER_URL}}" lang="{{OTHER_LANG}}">{{OTHER_LABEL}}</a>
  <h1>{{t:pageTitle}}</h1>
  <script data-interaction></script>
</body>
</html>
```

上面只展示必要标记；完整页面还需要机制图、figure/figcaption、静态解释和来源。保留一个主标题。翻译不注入 HTML：`{{t:key}}` 的值会转义，应将结构标签写在 HTML 中。

可用占位符：

- `{{HOME_URL}}`、`{{TOPIC_URL}}`：当前语言的首页和主题页。
- `{{PAGE_URL}}`：当前语言的 canonical 绝对地址。
- `{{ZH_URL}}`、`{{EN_URL}}`：同一讲解的两个语言版本绝对地址。
- `{{HTML_LANG}}`：zh-CN 或 en。
- `{{OTHER_URL}}`、`{{OTHER_LANG}}`、`{{OTHER_LABEL}}`：另一语言版本的链接、lang 和按钮文字。
- `{{t:key}}`：从同名 copy.json 读取当前语言文案。

不要硬编码 `/`、`/learnbycode/` 或 `/en/`。生成器处理仓库子路径及语言前缀。

## 四、维护文案与动态交互

copy.json 用同一组稳定 key 组织两种语言：

```json
{
  "zh": { "pageTitle": "一次读取如何经过缓存", "back": "返回主题", "hit": "缓存命中", "miss": "缓存未命中" },
  "en": { "pageTitle": "How a read passes through a cache", "back": "Back to topic", "hit": "Cache hit", "miss": "Cache miss" }
}
```

在 TypeScript 中读取相同的文案文件：

```ts
import copy from './read-path.copy.json'
const language = document.documentElement.lang.startsWith('en') ? 'en' : 'zh'
const text = copy[language]
// 场景模型与路径保持共用；只让文字随 language 改变。
```

图标签、按钮、步骤标题、解释、结果、空状态、SVG title/desc、ARIA 标签与无 JS 静态说明都要翻译。不要直接把英文步骤写进独立的一套业务逻辑。缺少语言、键不一致、空文案或 HTML 占位符未提供翻译时，构建会失败。

现有 routing.ts 通过 query 参数将 scenario 与 step 传给另一语言页。如果新讲解也有阅读状态，给出合法值校验，并在更新时同步语言切换链接；不用这些状态的页面保留普通语言链接即可。

## 五、完成制作并发布到目录

内容核对完成后，把元数据改为：

```json
"status": "published",
"verifiedAt": "2026-11-10"
```

请填写实际核对日期，不直接复用示例。`minutes` 是阅读时间估计；`verifiedAt` 是事实/源码核对日期。published 缺少日期或源文件会使构建失败。

```sh
pnpm verify
pnpm render:review
BASE_PATH=/ pnpm build
pnpm build
pnpm preview
```

- verify 执行类型检查、两语言渲染、构建、内链和语言切换检查。
- render:review 用 Visual Explainer 检查两种语言的桌面与手机布局；修复所有错误并人工查看 `.generated/zh/…` 和 `.generated/en/…` 中的 sheet。
- 根路径构建模拟自定义域名；随后默认 build 恢复项目子路径。
- preview 展示最终生产产物。

逐项确认：英文页面无漏译；语言切换仍在同一内容；步骤可进退、暂停、拖动；键盘能操作；移动端网页不横向溢出；图形状态不只靠颜色区分；减少动态效果偏好生效；禁用 JS 后仍有图、解释和来源；计划中的页面没有链接。

最终页面地址：

```text
/learnbycode/explainers/caching/read-path/
/learnbycode/en/explainers/caching/read-path/
```

把源文件、元数据、必要资源和 pnpm-lock.yaml 变更提交即可。不提交 dist/、.generated/、public/explainers/、public/en/explainers/ 或 node_modules/。推送 main 后由 Pages 工作流构建；首次启用参见 [部署手册](deployment.md)。

## 常见问题

- 目录有标题但点不了：状态仍为 planned。
- 提示 Missing translation / Translation keys must match：检查两种语言是否有完全相同的 key，所有值均为非空字符串。
- 找不到入口文件：主题和讲解 slug、目录及三个文件的 basename 必须一致，复制后还要改 TS 的 JSON 导入。
- 修改交互后没变化：执行 pnpm render，再刷新；不要修改生成文件。
- 英文文字挤出 SVG：SVG 文本不会自动折行，应调整节点、使用 tspan 或简短标签，重新检查两种语言。
- 预览返回 404：确认使用带 /learnbycode/ 的地址；若此前运行过根路径构建，先恢复默认 build。

Visual Explainer 的 CSS 和脚本由渲染器内联；默认字体可能访问字体服务，断网时使用回退字体，核心教学交互不依赖网络。更新工具版本后应重新审阅两种语言。
