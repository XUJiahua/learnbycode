# Paseo remote 公网预览

用户不需要能访问开发机器的 localhost 或局域网。预览通过 cloudflared Quick Tunnel 提供公网 HTTPS URL。它只服务验证通过的 dist 快照；不是 GitHub Pages 正式发布。

## 已配置的行为

- 仓库内 `.paseo/public-preview.json` 显式启用，并要求 package 名称为 learnbycode。其他项目不生效。
- 插件安装在 daemon 上，Agent 开始回合时确保预览存在，completed 回合结束后写入刷新请求。子 Agent 和 canceled/failed 回合不触发刷新。
- Hook 使用当前 Paseo 0.14 的 API；支持新 addHook 名称，在尚未暴露该方法的 0.14 版本上使用仍兼容的 on 注册。
- 已运行的服务会复用，不创建重复隧道。源文件指纹没变化时不重复构建。
- 构建执行 pnpm verify。成功后切换静态快照；失败保留上一版页面，并在状态中记录 error，不能把旧页面称为新结果。
- 预览由 Paseo workspace service 或 workspace terminal 持有，回答结束后继续运行。手动停止标记阻止 hook 自动重启；工作区归档会停止其终端。

## 用户如何使用

用自然语言提出要求即可，例如：

> 新增一个缓存主题，用可切换的命中/未命中路径解释读缓存，给我中英双语页面和公网预览。

> 在 Super-agent 主题增加 Chain of Recall 讲解，可以逐层点开引用。

Agent 的执行入口写在 AGENTS.md，详细步骤在 [内容操作手册](authoring.md)。它应完成制作、验证和预览，无需你填写工程文件。手册是执行约定，不是脱离 Agent 单独运行的自动生成程序。

## 服务控制

在 Paseo workspace 的 Scripts 中运行 public-preview；也可以从仓库根目录执行：

```sh
pnpm preview:public    # 长期运行：验证、静态服务、cloudflared
pnpm preview:status   # 公网 URL、构建时间、指纹、错误和 handledRequest
pnpm preview:refresh  # 请求检查源文件变化并刷新
pnpm preview:stop     # 写入停止标记，服务停止，hook 不再重启
pnpm preview:enable   # 清除停止标记；下次 Agent 回合恢复自动启动
```

Paseo 使用 paseo.json 中的定义，为服务分配 PASEO_PORT。Hook 通过 workspace terminal 启动时使用 OS 分配端口。进程锁避免两种入口启动重复实例。确认终止后再手动重启 public-preview；不要直接删除正在运行的锁目录。

`.preview/` 保存本工作区的本地状态，不提交 Git。刷新请求是异步的；读取 `.preview/refresh`，等状态中的 handledRequest 与其匹配。状态 error 非空表示新构建未成功。服务退出时会关闭自己启动的 cloudflared 和构建进程。

## 安装或更新 hook

本机已安装 learnbycode-preview。插件源码在 tools/paseo-preview/，实际安装使用 daemon 上的稳定目录，避免当前 worktree 被删除后插件也消失。其他 daemon 需要各自安装。

要求 Paseo 0.14、Node.js 24、pnpm 和 cloudflared 可用，且 daemon 已启用插件。Agent 应按 paseo-plugin skill 检查 pluginsEnabled，不得擅自开启被关闭的全局开关。

```sh
pnpm install --frozen-lockfile
pnpm --dir tools/paseo-preview check
pnpm --dir tools/paseo-preview test
mkdir -p ~/.local/share/learnbycode-paseo-preview-plugin
cp tools/paseo-preview/index.server.ts tools/paseo-preview/paseo-plugin.json tools/paseo-preview/OVERVIEW.md ~/.local/share/learnbycode-paseo-preview-plugin/
paseo plugin install ~/.local/share/learnbycode-paseo-preview-plugin
paseo plugin ls learnbycode-preview
```

更新源码后重新复制并运行 `paseo plugin reload learnbycode-preview`。不要为了加载插件重启 daemon。Paseo Desktop 自带 CLI 不在 PATH 时，Agent 可定位 Desktop 内的 CLI 运行，不需要全局安装另一版本。

## 链接与边界

Quick Tunnel 不需要域名或 Cloudflare 账户。Anyone with the URL can read this preview. 隧道重建时地址会变化；同一个隧道内刷新内容不改变链接。固定域名需要另外配置 named tunnel。

公网只开放当前静态快照，不开放源目录、开发服务器、Paseo daemon 或凭据目录。Cloudflared 使用本工作区的空配置，不修改这台机器已有的隧道配置。公网服务按请求只允许 GET/HEAD，检查路径范围及符号链接目标。

如果链接不可访问，先查 preview:status 和 Public preview 终端的 cloudflared 输出；不能仅凭它打印了 URL 就声称公网检查通过。

依据：[Paseo hooks](https://paseo.sh/docs/plugins/hooks)、[workspace services](https://paseo.sh/docs/worktrees#scripts-and-services)、[Cloudflare Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/)。
