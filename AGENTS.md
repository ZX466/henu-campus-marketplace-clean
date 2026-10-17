# 项目协作约定（给 Codex / 自动化助手）

本文件是本仓库内自动化助手的工作约定，优先级高于助手的默认习惯。

## 1. 完成即停，先交给用户试用

- 完成一项任务后，**不要自动 `git add` / `git commit` / `git push`**。
- 先交付三件事：**改了什么、怎么验证、怎么看效果**（本地 URL 或截图）。
- 只有用户明确说“提交”之后才能提交；用户没有说推送时，推送前先确认一次。
- 用户试用后提出修改意见，改完仍然重复上面的流程。

## 2. 绝对不要提交的文件

- `02_校园跑腿前端闭环.md`：**永远不允许进入 Git**（已在 `.gitignore` 中忽略）。
  不要用 `git add -f` 强制添加，也不要用其它方式绕过忽略规则。
- 不要提交 `node_modules/`、`backend/.venv/`、`frontend/dist/`、`.env`、`*.db`。

## 3. 分支与提交规范

- 从最新 `main` 创建分支，命名用 `feature/<简短描述>` 或 `fix/<简短描述>`。
- 提交信息用 `feat:` / `fix:` / `docs:` 前缀，例如
  `feat: unify API error format and document core field contract`。
- 一个分支/PR 只包含一个任务范围内的改动；不要夹带无关修改。

## 4. 提交前的验证

- 前端改动：`npm run build` 通过。
- 后端改动：
  `.\backend\.venv\Scripts\python.exe -m compileall backend`
  与 `.\backend\.venv\Scripts\python.exe -m pytest backend -q`。
- 提交前用 `git status` 确认第 2 条列出的文件不在暂存区里。

## 5. 提交前关闭开发服务，等用户手动验证

- 完成修改后、**提交之前**，先把本次为演示/测试启动的服务全部关掉：
  前端 Vite dev server、后端 uvicorn、临时浏览器/无头进程等，
  并确认 3334 / 8000 等端口已经释放。
- 然后在交付信息里写清楚"怎么手动启动并验证"，由用户自己启动、自己检测。
- 只有用户手动验证通过、明确说"提交"之后，才执行 `git commit`；
  用户没有说推送时，推送前再确认一次。
- 提交完成后同样不要留下正在运行的服务。
