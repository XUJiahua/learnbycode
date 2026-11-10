# Learn by Code

中英双语交互图解站，使用 Astro + TypeScript 和固定版本的 Visual Explainer 渲染器，静态部署到 GitHub Pages。

使用 Node.js 24、pnpm 11.5.2：

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm verify
pnpm render:review
```

中文入口 `/learnbycode/`，英文入口 `/learnbycode/en/`。主题由 src/content/topics/*.json 注册；首个交互页对照源码解释 Super-agent 的事件路由。

在 GitHub 仓库 Settings → Pages 中选择 GitHub Actions，再推送 main 即可触发部署工作流。
