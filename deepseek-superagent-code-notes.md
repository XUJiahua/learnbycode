# Super-agent 文章与源码对照

调研日期：2026-11-10。静态阅读源码，未运行带 API/GitHub/飞书凭据的服务。

## 来源和版本

- [原文：Exploring Super-agent Design](https://x.com/DeepSeekHarness/status/2116857257245987236)。X 直接读取受限，通过 `https://r.jina.ai/https://x.com/DeepSeekHarness/status/2116857257245987236` 取得正文。原文明确是架构探索，不是现有 Harness 功能介绍。
- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/tree/fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159)：底座。
- [dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype/tree/8c32a9dc5d72c033816c6a8110b37f40cf94fba4)：对应部分架构的研究原型。README 明确其与文章、内部实现不同，部分设计尚未实现。

以下 prototype 文件链接固定在所读提交，避免后续版本变化。

## 主张与实现

1. **连续协作与并发执行**：Router 负责跨任务交互、分派，Worker 执行独立任务。原型分别称为 Main Session / Executor Session，代码角色为 orchestrator / worker。`Sessions.ensure` 根据角色选 preset 与模型；`DshExecutor.launch` 为 Ticket 准备目录并建立 Worker。一个持续 Agent 可以由多个 Session 实现。
   - [sessions.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/src/app/sessions.ts#L138)
   - [dsh.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/src/executor/dsh.ts#L424)
2. **事件驱动与两阶段过滤**：Source 产出 Trigger；确定性的 scope/gate 先筛选；候选事件再交模型研判。显式请求和主动候选的具体执行路径有区别，不能将所有事件描述为必经完全相同的语义研判。原型主动接单默认 observe：只记 would_accept，不实际接单；auto 才会执行符合规则的主动工作。
   - [intake.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/src/core/intake.ts#L19)
   - [evals.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/src/core/evals.ts#L69)
   - [authorization](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/docs/002-authorization.md#L94)
3. **订阅透传**：Thread 是外部讨论事件流，不是 OS 线程。订阅关系是 Ticket↔Thread 多对多；Intake 将事件添加到已订阅 Ticket 的 Input。没有 Worker 决定归属的事件进入 Eval。当前原型的精确规则：人的有效后续消息可绕过 Eval；bot/CI 仍可扇出给 Worker，同时进入 Eval。原文两条路径是架构概括。
   - [intake.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/src/core/intake.ts#L38)
   - [domain](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/docs/001-domain.md)
4. **Batching**：`Evals.start` 将 Thread 的 pending Trigger 批量放进一次 Eval，并清空 pending；新到事件留给后续 Eval。单 Router 的下一次推理还可收取积累的多个输入。每 Thread 串行，不代表整个系统只能执行一个任务。
   - [evals.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/src/core/evals.ts#L108)
5. **Inline & Spill / Chain of Recall**：`triggerCard` 内联 160 字符预览、Thread、ID 和 `read`；`threadCard` 给 Ticket ID；`ticketDetails` 给 Thread、Assignment、结果及 transcript 路径；Resources 按路径分页读取。模型沿引用图逐跳补齐上下文。原型这里的 Spill 是完整信息留在存储，窗口只留摘要/指针；底座另有专用工具输出 spill 插件，二者不可混作一个 API。
   - [cards.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/src/app/cards.ts#L8)
   - [resources.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/src/app/resources.ts#L24)
   - [底座 spill policy](https://github.com/deepseek-ai/deepseek-harness/blob/fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159/packages/spill/spill-policy/src/index.ts#L134)
6. **异步 ReAct / 双工**：原型 preset 将前台 shell 等待上限设为 5000ms，随后转后台；jobs 等待同样有界；后续 Input 以 steer 投入 Worker。底座 tool-jobs 处理任务完成事件并注入/唤醒 Session。不是同一 Session 同时跑两次模型推理，也不是任意同步工具都能被立刻中断。
   - [preset](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/cordis.patch.yml#L40)
   - [steer](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/src/executor/dsh.ts#L329)
   - [底座 tool-jobs](https://github.com/deepseek-ai/deepseek-harness/blob/fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159/packages/jobs/tool-jobs/src/index.ts#L338)
7. **投机执行**：文中指用额外后台计算提前复现、验证和准备方案，结果有价值才交付。原型提供规则、inferred Mandate、observe/auto 和安静通信等机制，但默认不会观察到任意问题就自主执行。
   - [philosophy](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/docs/000-philosophy.md)
   - [authorization](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/docs/002-authorization.md#L94)
8. **持久化与执行环境分离**：文章提出云端无状态 Loop + 外置 Session 状态 + 本地/远端执行 daemon 的目标架构（BYOM）。公开原型具体实现主要是 SQLite Store、持久 Effects 队列、恢复中断 Assignment、每 Ticket 一个目录；这些不等于已经实现整套分布式云端架构。底座的进程内后台 jobs 也不会跨进程重启存活。
   - [architecture: Store / Effects](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/docs/007-architecture.md#L149)
   - [底座 jobs](https://github.com/deepseek-ai/deepseek-harness/blob/fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159/packages/jobs/jobs/README.md)
9. **Watchdog**：文章提出独立于主系统、能检查实质进展的 Agent Control Loop。公开部署文档有不同 profile 下运行的 hourly check 提示词，检查 status、按错误类别恢复，并尊重人工停止标记。这是实际可读的外部恢复方案；不能据此断言已有自动诊断所有 Worker 语义跑偏的完整实现。
   - [hourly check](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/docs/006-deployment.md#L132)

## 实验的解释边界

原文 7.1 的任务执行由耗时工具模拟，每种设计 5 次，测调度和协作，不测真实编码正确性。Super-agent p50/p95 为 12.4/15.7 分钟，去掉 pass-through 为 12.6/15.5；cache-read token 分别为 23.2M、31.8M。因此该组结果中透传的直接证据是减少 cache-read token，不能说透传显著降低延迟，亦不能把 token 指标直接当作总 API 成本。[来源：原文第 7 节](https://x.com/DeepSeekHarness/status/2116857257245987236)。
