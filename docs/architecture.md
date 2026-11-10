# 工程结构

本站使用 Astro 静态多页输出。首页和主题目录由内容集合生成；交互讲解是可独立打开的 HTML。两者用普通链接连接，不需要客户端路由或服务端，也不通过 iframe 嵌套。

```text
src/content/topics/*.json       主题、讲解列表、发布状态与核对日期
src/content.config.ts           内容 schema
src/pages/                      双语静态路由、404
src/layouts/                    公共布局与 SEO 元数据
src/components/                 目录组件
src/lib/paths.ts                Astro 站内链接的统一 base 和语言前缀
src/lib/i18n.ts                 语言配置与站点 UI 翻译
src/lib/content-schema.ts       构建器和 Astro 共用的双语元数据 schema
src/styles/                     目录页设计规则
explainers/<topic>/<lesson>/    *.src.html + 同名 *.ts / *.copy.json
scripts/render-explainers.mjs   元数据驱动的图解生成
scripts/check-site.mjs          生产产物内链与路径检查
public/explainers/              自动生成，忽略提交
.generated/                    中间文件与视觉检查图，忽略提交
dist/                          Pages 发布产物，忽略提交
```

## 构建过程

1. 扫描主题 JSON，检查 slug、重复讲解和已发布内容的核对日期。
2. 对每篇 `published` 讲解，用 esbuild 将同名 TypeScript 打包并内联到 HTML 中。
3. 替换站内链接与 canonical 占位符，使用项目锁定版本的 Visual Explainer 渲染器内联 kit。
4. 将中英文页面分别输出到 `public/explainers/<topic>/<lesson>/index.html` 和 `public/en/explainers/<topic>/<lesson>/index.html`。
5. Astro 校验内容集合并生成目录页，同时将独立讲解复制到 `dist/`。
6. 检查所有 HTML 的语言、主标题、本站资源和链接，防止逃出 Pages base 或引用缺失页面。

渲染器的布局规则来自安装的 skill。项目 CSS 负责与目录页一致的浅色背景、青绿强调色、可访问焦点和文字排版。生成文件不得手改。

## 交互边界

首篇讲解使用独立情境数据描述事件路径，每步包含节点、边、解释和源码摘录。它是明确标注的教学模型，不运行上游代码、不访问凭据、不发 GitHub 评论。源码链接固定到公开原型提交。

切换事件重置到第一步；首次进入展示完整的新请求路径。播放由读者主动触发，支持暂停；页面隐藏时自动停止。减少动态效果偏好关闭路径动画，步骤仍可操作。无 JavaScript 时保留静态图、结论、边界和来源。

未来的上下文、异步执行、恢复主题各自维护交互逻辑。只有出现实际重复时才提取共享交互组件。

## 双语内容

中文路径不带语言前缀，英文使用 en/。Astro 路由由同一 LibraryPage 组件生成；html lang、canonical 和 hreflang 与各自语言一致。交互 HTML 用 {{t:key}} 读取同名 .copy.json 中的 zh / en 文案，同一 TypeScript 根据 html lang 选择文案。生成器拒绝缺失语言、空文案、键集合不一致和未替换占位符。

所有部署路径由 base + 语言前缀 + 内容路径组成。语言按钮只切换同一内容的语言；交互页将情境与步骤附加到对方语言 URL 的 query，避免读者切换语言后丢失位置。

依赖由 packageManager 固定 pnpm 11.5.2；pnpm-workspace.yaml 显式管理安装脚本许可。CI 安装同版本 pnpm，缓存 pnpm store 并使用 frozen lockfile。
