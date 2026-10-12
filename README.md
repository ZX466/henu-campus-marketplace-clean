# 河大同享｜河南大学校园二手交易与互助平台

河大同享是面向河南大学金明、明伦校区的校园二手交易网页。项目以书籍交易为重点，同时支持数码产品、宿舍用品、出行工具、在线沟通、跑腿任务和书籍随机推荐。

## 第一版功能

- 校园商品浏览、搜索、分类筛选和校区筛选
- 书籍专区：教材、专业书、考研资料、四六级资料
- 商品详情、收藏、交易清单、卖家沟通和交接凭证演示
- 商品发布表单
- 校园跑腿任务发布、搜索和接单状态演示
- 专业书单推荐助手：第一版使用随机推荐，后续可接入大模型
- 金明校区、明伦校区地图和建议交接点

## 技术栈

- 前端：React 18、Vite、Tailwind CSS、Lucide React
- 后端：FastAPI
- 数据库：MongoDB（未配置数据库时，前端使用演示数据）
- 地图：Leaflet + OpenStreetMap / Esri 瓦片

## 本地运行

    npm install
    npm run install:frontend
    npm run dev:frontend

后端服务需要 Python 环境和 MongoDB 配置；第一版网页即使后端未启动，也可以浏览演示商品和跑腿任务。

## 项目模块

    frontend/src/
    ├── components/
    │   ├── OverviewGatewayView.jsx    首页与产品介绍
    │   ├── HomrPageIdeaView.jsx       登录后的校园工作台
    │   ├── MarketplaceView.jsx        商品交易大厅
    │   ├── SellItemView.jsx           发布商品
    │   ├── ServicesView.jsx           跑腿任务广场
    │   ├── CourseView.jsx             专业书单与使用流程
    │   ├── WestBengalMapModal.jsx     河南大学校区地图（沿用原文件名）
    │   └── CampusBot.jsx              校园智能体入口
    ├── data/
    │   └── mockData.js                河南大学演示商品和服务数据
    └── services/api.js                前后端接口客户端

## 团队开发约定

每个人从 main 创建自己的分支，完成一个模块后提交 Pull Request，再合并到 main。商品、跑腿、聊天、推荐和后台模块可以分别建立 Issue 追踪。

## 来源与许可

本项目基于 [Sowmajit-Kar/CAMPUSCART](https://github.com/Sowmajit-Kar/CAMPUSCART) 进行二次开发，保留原项目 MIT License。新增的河南大学业务设计、界面、演示数据和功能实现由本项目组维护。
