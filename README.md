# Learn by Code

用交互图解和真实代码，理解复杂系统如何工作。按「主题 → 独立讲解页」组织，部署到 GitHub Pages。

目标地址：<https://xujiahua.github.io/learnbycode/>。仓库：<https://github.com/XUJiahua/learnbycode>。

## 本地开发

使用 Node.js 24 和 pnpm 11.5.2。依赖版本由 `pnpm-lock.yaml` 固定。

```sh
nvm use
pnpm install --frozen-lockfile
pnpm dev
```

打开终端输出的 `/learnbycode/` 地址。Astro 文件支持热更新；修改 `explainers/` 的 HTML、TypeScript 或 copy.json 后另运行 `pnpm render`，刷新页面。

```sh
pnpm verify         # 类型检查、图解生成、生产构建、全站内链检查
pnpm render:review  # Visual Explainer 桌面/手机视觉检查，输出审阅图
pnpm preview       # 预览生产构建
```

视觉检查使用 `playwright-core`，需本机安装 Chrome/Chromium 或相应 Playwright 浏览器；它不参与普通 CI 构建。渲染时生成 `.generated/` 下的审阅图。CI 的常规构建不启动浏览器，也不调用模型或外部 API。

## 双语页面

中文保留原路径，英文位于 `/en/`。页面右上角可切换到同一内容的另一语言版本；讲解页会保留当前情境与步骤。首页、目录、图解、步骤、按钮和无障碍标签均有两种语言，无 JS 时也能阅读。

- 中文：`/learnbycode/`
- English：`/learnbycode/en/`

## 内容

首个主题：[DeepSeek Super-agent](https://xujiahua.github.io/learnbycode/topics/superagent/)。首篇讲解「一条消息，走哪条路？」可切换明确请求、普通聊天、PR 后续评论和 CI 结果，支持步骤前后切换、播放、暂停、拖动进度与源码对照。

- [如何新增主题与讲解](docs/authoring.md)
- [自然语言请求与 Paseo remote 公网预览](docs/remote-preview.md)
- [目录与生成流程](docs/architecture.md)
- [Pages 配置与发布](docs/deployment.md)
- [前期源码调研](deepseek-superagent-code-notes.md)

## GitHub Pages

首次发布前，在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。推送 `main` 后，工作流检查并构建，再发布 `dist/`；PR 仅检查。提交后 CI 的通过不等于已发布，部署结果以 Pages 工作流为准。

默认本地配置是 `/learnbycode`；Pages 工作流从官方 action 读取真实 origin 和 base path。自定义域名先在仓库 Pages 设置中配置，再参考 [部署说明](docs/deployment.md)。

## 工具与来源

Astro 负责静态目录和导航，TypeScript 实现交互，`visual-explainer@0.15.0` 负责图解渲染。渲染器作为项目开发依赖安装，任何新机器都不依赖个人 skill 路径。生成文件、浏览器审阅图和 `dist/` 均不提交。

图解标明教学假设、源码固定提交及核对日期，不将文章中的架构设想描述为原型已有能力。
