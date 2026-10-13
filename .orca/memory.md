# memory.md — Claude（主工作树，main 分支）

> Claude 开启新对话时：先读 .orca/workflow.txt，再读本文件，然后继续任务。
> 上下文达到 50% 时，先把状态写入本文件再切换新对话。

## 角色定位
- Claude 是本项目的组织者/主导者：负责任务分配、架构/代码质量/逻辑/测试、
  前端/体验/发布/运维，并在 main 分支上合并各 agent 分支的成果。
- 评审职责：评审 cline（依赖/配置/文档）与 kilo（接口/兼容性）的产出。

## 协作基础设施状态（2026-10-13 建立）
- .orca/workflow.txt、.orca/agent-registry.md 已建立并同步到全部 5 个 agent 工作树。
- 各工作树 .orca/talking.txt 已建立（主工作树为汇总板）。
- .orca/memory.md 各工作树已建立。
- agent 配置文件夹分布（严格按用户规则）：
  - 所有工作树: .codegraph .agent .orca
  - 主工作树: 另有 .claude .opencode .codex（全都有）
  - codex 工作树: .codex；opencode 工作树: .opencode
  - cline / kilo / pi 工作树: 无命名配置文件夹（用户未指定）

## 待办 / 进行中
- [ ] 生成 .gitignore 规则（.orca 入库，其他 . 开头 agent 配置文件夹不入库）
- [ ] 为全部工作树初始化 .codegraph 索引
- [ ] 各 agent 工作树补齐对应配置文件夹
- [ ] 等待用户下达第一批开发任务

## 项目要点
- 技术栈: React 18 + Vite 6 + Tailwind（frontend/）；FastAPI + Motor/MongoDB（backend/）
- 一键启动: 根目录 npm run dev（后端需先建 backend/.venv，用 uv）
- 远程: github.com/hwd-123456/henu-campus-marketplace-clean
- main 最近提交: 27576a1 docs: clarify Windows setup and login startup
- 工作区有未提交改动: frontend/package-lock.json, package-lock.json
