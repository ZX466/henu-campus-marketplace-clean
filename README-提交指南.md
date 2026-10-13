# 五人协作提交指南

本文说明五人团队如何领取今天的任务、修改指定文件、提交代码并发起 Pull Request。

仓库地址：<https://github.com/hwd-123456/henu-campus-marketplace-clean>

## 一、先记住三条规则

1. **不要直接修改或推送 `main` 分支。**
2. 每个人只在自己的功能分支中修改自己负责的文件。
3. 完成后先自测，再推送分支，最后创建 Pull Request。

## 二、第一次准备

### 1. 安装 Git

Windows 安装 Git：<https://git-scm.com/download/win>

安装后打开 PowerShell，检查：

```powershell
git --version
```

### 2. 克隆仓库

只需要第一次执行：

```powershell
cd Desktop
git clone https://github.com/hwd-123456/henu-campus-marketplace-clean.git
cd henu-campus-marketplace-clean
```

如果仓库已经存在，不要重复克隆，进入原来的仓库目录即可：

```powershell
cd Desktop\henu-campus-marketplace-clean
```

### 3. 同步最新主分支

每次开始任务前执行：

```powershell
git switch main
git pull origin main
```

## 三、创建自己的功能分支

| 成员 | 分支名 |
| --- | --- |
| 成员 1 | `feature/ui-campus-cleanup` |
| 成员 2 | `feature/errand-frontend` |
| 成员 3 | `feature/errand-api` |
| 成员 4 | `feature/book-wish-api` |
| 成员 5 | `feature/conversation-api` |

创建分支示例：

```powershell
git switch -c feature/ui-campus-cleanup
```

如果分支以前已经创建过：

```powershell
git switch feature/ui-campus-cleanup
git pull origin feature/ui-campus-cleanup
```

## 四、五个人分别修改哪些文件

### 成员 1：校园化前端与页面清理

分支：`feature/ui-campus-cleanup`

主要修改：

```text
frontend/src/App.jsx
frontend/src/index.css
frontend/src/components/WestBengalMapModal.jsx
frontend/src/data/westBengalColleges.js
docs/ui-cleanup.md
```

工作范围：清理旧项目名称、统一河南大学文案、确认金明和明伦校区、检查手机端布局。

### 成员 2：校园跑腿前端闭环

分支：`feature/errand-frontend`

主要修改：

```text
frontend/src/components/ServicesView.jsx
frontend/src/App.jsx
docs/errand-frontend.md
```

工作范围：任务发布、校区筛选、接单、完成，以及刷新后保留状态。今天可以先用 `localStorage`，不要等待后端接口完成。

### 成员 3：跑腿接口与字段合同

分支：`feature/errand-api`

主要修改：

```text
backend/app/routes/errands.py
backend/app/models/errand.py
backend/app/main.py
docs/api-contract.md
```

工作范围：完成跑腿查询、发布、接单、完成四个接口，统一 `task_id`、`creator_id`、`claimer_id`、`campus`、`status` 等字段。

### 成员 4：书单与智能求购接口

分支：`feature/book-wish-api`

主要修改：

```text
backend/app/routes/booklists.py
backend/app/routes/wishes.py
backend/app/models/booklist.py
backend/app/models/wish.py
docs/book-wish-api.md
```

工作范围：书单查询、求购文本解析、缺失字段追问。今天先使用规则解析，不接真实大模型。

### 成员 5：私信后端最小闭环

分支：`feature/conversation-api`

主要修改：

```text
backend/app/routes/conversations.py
backend/app/models/conversation.py
backend/app/models/message.py
docs/conversation-api.md
```

工作范围：创建或复用会话、发送消息、读取历史、标记已读，并检查会话参与者权限。

## 五、修改前先安装依赖

只改前端的成员：

```powershell
npm install
npm run install:frontend
```

改后端的成员：

```powershell
py -3.12 -m venv backend\.venv
.\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

如果 `backend\.venv` 已经存在，不需要重复创建，只执行依赖安装命令即可。

## 六、提交前必须自测

### 前端成员

```powershell
npm run build
```

页面功能至少手动检查一次，并保存截图。

### 后端成员

```powershell
.\backend\.venv\Scripts\python.exe -m compileall backend
.\backend\.venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'backend'); from app.main import app; print(len(app.openapi()['paths']))"
```

如果新增接口，打开后端 `/docs` 页面，确认接口能显示，并保存请求和响应示例。

## 七、保存修改并提交

先查看自己修改了什么：

```powershell
git status
git diff --stat
git diff
```

确认没有把以下内容提交进去：

```text
node_modules/
frontend/dist/
backend/.venv/
.env
*.db
```

保存到本地 Git：

```powershell
git add frontend backend docs
git status
git commit -m "feat: describe your change"
```

提交信息示例：

```powershell
git commit -m "feat: add errand task frontend flow"
git commit -m "feat: add book wish parsing API"
git commit -m "feat: add conversation API"
```

## 八、推送自己的分支

第一次推送：

```powershell
git push -u origin feature/ui-campus-cleanup
```

把命令中的分支名换成自己的分支。之后再次提交只需要：

```powershell
git push
```

推送成功后，打开仓库页面，GitHub 通常会显示 **Compare & pull request** 按钮。

## 九、创建 Pull Request

标题示例：

```text
feat: add errand task frontend flow
```

描述中必须包含：

```markdown
## 完成内容
- 完成了什么功能
- 修改了哪些文件

## 测试结果
- [ ] npm run build
- [ ] 后端 compileall 或接口测试
- [ ] 已附页面或接口截图

## 未完成内容
- 还需要后续联调的部分
- 当前使用演示数据的部分
```

创建 Pull Request 时：

1. `base` 选择 `main`；
2. `compare` 选择自己的功能分支；
3. 不要选择其他人的分支作为目标；
4. 把对应的前后端成员加为 reviewer；
5. 等至少一名成员检查后再合并。

## 十、合并规则

只有仓库负责人或指定合并人执行合并：

1. 确认构建或接口检查通过；
2. 确认 Pull Request 只包含对应任务；
3. 确认没有提交 `.env`、密码或数据库文件；
4. 点击 **Merge pull request**；
5. 合并后删除远程功能分支；
6. 所有人重新同步主分支：

```powershell
git switch main
git pull origin main
```

## 十一、遇到冲突怎么办

不要直接强制推送 `main`。先保存当前工作：

```powershell
git status
git add .
git commit -m "wip: save current work"
git switch main
git pull origin main
git switch feature/your-branch
git merge main
```

打开冲突文件，删除冲突标记：

```text
<<<<<<< HEAD
=======
>>>>>>> main
```

保留正确内容后执行：

```powershell
git add .
git commit -m "fix: resolve merge conflicts"
git push
```

## 十二、今天每个人提交前的最小清单

- [ ] 我在自己的功能分支上；
- [ ] 我只修改了任务范围内的文件；
- [ ] 我没有提交 `.env`、密码、`node_modules` 或虚拟环境；
- [ ] 前端构建或后端接口检查通过；
- [ ] 我写了修改说明；
- [ ] 我准备了截图或请求响应示例；
- [ ] 我已经推送自己的分支；
- [ ] 我已经创建 Pull Request；
- [ ] 我把需要联调的字段和问题写清楚了。

## 十三、最常用的命令速查

```powershell
git switch main
git pull origin main
git switch -c feature/your-branch
git status
git diff --stat
git add .
git commit -m "feat: describe your change"
git push -u origin feature/your-branch
```

提交完成后，把 Pull Request 链接发到团队群里，并说明：完成内容、测试结果、截图和需要谁联调。

