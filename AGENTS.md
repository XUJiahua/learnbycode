# Learn by Code

这是中英双语交互讲解站，使用 Astro + TypeScript，静态部署至 GitHub Pages。开始前读 README.md 和 docs/architecture.md。

## 自然语言内容请求

当用户要求新增或更新主题、交互讲解、概念可视化时，必须先读 docs/authoring.md，然后按手册直接执行。用户只需描述主题、要解释的问题、参考资料和期望交互；不得要求用户手动填写 JSON、创建目录或运行命令。信息足够时自行确定合理的标题、slug、页面拆分和教学情境，只有会改变核心含义或事实依据的缺失信息才询问。

完整交付包括：核实来源、双语元数据、两种语言的全部静态/动态文案、共享交互逻辑、来源和假设、核对日期、构建与视觉检查。完成并验证后设为 published；未完成的内容保留 planned。沿用 visual-explainer skill。

## Remote 公网预览

用户通过 Paseo remote 访问，localhost 和内网地址不能作为可用预览交付。先读 docs/remote-preview.md。默认使用 Paseo 管理的 public-preview 服务与 Cloudflare Quick Tunnel；确认实际公网地址返回正确页面，再把公网链接交给用户。预览需跨回合保持运行，不在回答结束时停止。用户明确停止后尊重 .preview/stopped 标记。

项目的 hook 按 .paseo/public-preview.json 显式启用。Agent 开始工作时确保服务存在，成功结束回合时请求更新；只有内容指纹变化才重建。等待 pnpm preview:status 的 handledRequest 与刷新请求一致，且 error 为 null，再声称新内容已刷新。

- 新主题通过 src/content/topics/*.json 注册；planned 内容不生成可点击链接。
- 交互页源文件位于 explainers/<topic>/<lesson>/，同名 .src.html 和 .ts；不要编辑生成产物。
- 使用 visual-explainer skill 制作图解。构建使用项目内固定版本的渲染器，不依赖个人 skill 路径。
- Astro 站内链接调用 src/lib/paths.ts；独立讲解用构建占位符；必须兼容 /learnbycode/ 与 /。
- 任何教学模型须标注假设与简化。源码链接固定 commit，更新事实时同步 verifiedAt。
- 保留无 JS 静态说明、键盘操作、明显焦点、移动端可读性和 prefers-reduced-motion。
- 变更后运行 pnpm verify；路径变更另跑 BASE_PATH=/ pnpm build。交互视觉变更执行 pnpm render:review 并审阅生成 sheet，浏览器确认操作。
- 不提交 dist/、public/explainers/、.generated/ 或 node_modules/。发布与代码验证分开报告。

- 中文使用原 URL，英文使用 /en/ 前缀；语言切换指向同一内容，保持情境和步骤。
- 主题文字使用 { zh, en }，交互页共用 .src.html 和 .ts，文案在同名 .copy.json 中；不能只翻译可见标题而遗漏步骤、图标签、ARIA 或静态说明。
- 只使用 pnpm 11.5.2 与 pnpm-lock.yaml；不要创建其他包管理器锁文件。
