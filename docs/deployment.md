# GitHub Pages 部署

## 首次启用

目标仓库是 `XUJiahua/learnbycode`，默认分支为 `main`。本地已配置 `origin`，但配置 remote 不会推送代码或启用 Pages。

1. 把审阅后的工程提交并推送到仓库。
2. 在 Settings → Pages → Build and deployment，将 Source 设为 GitHub Actions。
3. 若第一次推送时尚未启用 Pages，可启用后手动运行 Deploy GitHub Pages 工作流。
4. 检查 build、deploy 两个 job；以 deploy 返回的实际 URL 为准。

工作流仅在 `main` push 或手动触发时部署。build 只读仓库，deploy 才拥有 `pages: write` 与 `id-token: write`，使用 `github-pages` environment 和部署并发组。Actions 固定 commit，Dependabot 按月提出升级。

部署流程在自己的 build job 运行 `pnpm verify`，验证失败不会上传或部署产物。另一个 CI 工作流在 PR 和 main 检查项目路径与根路径两种构建。

## 路径配置

本地默认：

```text
SITE_URL=https://xujiahua.github.io
BASE_PATH=/learnbycode
```

部署时 `actions/configure-pages` 的 `origin`、`base_path` 输出传入构建，避免仓库更名或使用自定义域名后继续生成旧路径。

本地模拟自定义域名的根路径：

```sh
SITE_URL=https://example.com BASE_PATH=/ pnpm build
```

之后运行默认 `pnpm build` 恢复项目路径产物。自定义域名必须先在仓库 Pages 设置配置域名、DNS 与 HTTPS；工程不预写 CNAME。

## 约定与限制

- 只发布 `dist/`；不提交 node_modules、生成 HTML 或本地检查图。
- GitHub Pages 直接服务真实目录页面，不使用 SPA history fallback。
- `404.html` 提供返回目录的入口并标为 noindex。
- 本地验证通过不能证明远端发布成功。推送、Pages 启用、工作流和线上结果应分别确认。
- 本站不需要 API key、部署 PAT 或仓库 secrets。

依据：[GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)、[Astro GitHub Pages 部署](https://docs.astro.build/en/guides/deploy/github/)。

## pnpm 与双语检查

工作流先用 pnpm/action-setup 读取 package.json 的 packageManager，再安装 Node.js 24 并缓存 pnpm store。`pnpm install --frozen-lockfile` 不允许 CI 更新锁文件。Dependabot 的 package-ecosystem 仍使用 npm，这是它对包含 pnpm 项目的 JavaScript 生态的配置名。

一次构建同时生成中英文，两个语言版本随同一个 Pages artifact 发布。CI 对根路径和项目子路径均检查语言对照、切换链接及全部内链。
