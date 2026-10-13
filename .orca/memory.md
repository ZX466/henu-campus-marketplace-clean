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

## 远程仓库（2026-10-13 用户指示更新）
- origin = https://github.com/ZX466/henu-campus-marketplace-clean.git（提交目标，不用 Gitee）
- upstream = https://github.com/hwd-123456/henu-campus-marketplace-clean.git（原 origin 改名，只拉不推）
- 直连 GitHub 已测试可用；若不通再用 127.0.0.1:7897 代理
- agent 配置文件夹名修正为 .agents（原 .agent 已删，全部 6 个工作树已换）
- main 推送状态: 领先 origin/main 5 个本地提交，尚未推送（等用户指示）

## 待办 / 进行中
- [x] 2026-10-13 规则符合性检查完成，发现并修复 3 处问题：
  1. 主工作树 .agent 丢失 → 已重建（check-ignore 验证已被忽略）
  2. 各 agent 工作树 .gitignore 有未提交改动 → 已提交并与 main 字节级一致
  3. 各 agent 分支落后 main 7-8 个提交（上游 hwd-123456 新增 5 个提交：
     跨平台后端启动脚本 scripts/start-backend.cjs + README 文档；经 pull 进入本地，
     与本地基础设施提交形成合并 3913cdd）→ 已将全部 agent 分支 rebase 到 main，
     冲突文件 memory.md/talking.txt 按策略保留各 agent 专属版本
- 最终状态: 各 agent 分支领先 main 1 个提交（.orca 初始化）、落后 0；
  所有工作树 working tree 干净；workflow/registry 全树一致；talking/memory 各树专属正常
- [ ] 等待用户下达第一批开发任务
- [ ] 未推送远程（用户未要求；推送时只推 main，代理人分支 ZX666X/* 不推）

## 项目要点
- 技术栈: React 18 + Vite 6 + Tailwind（frontend/）；FastAPI + Motor/MongoDB（backend/）
- 一键启动: 根目录 npm run dev（后端需先建 backend/.venv，用 uv）
- 远程: github.com/hwd-123456/henu-campus-marketplace-clean
- main 最近提交: 27576a1 docs: clarify Windows setup and login startup
- 工作区有未提交改动: frontend/package-lock.json, package-lock.json
