# god-wechat

这是一个微信小程序项目，包含前端小程序代码和后端 Node.js 服务。

## 功能介绍

- 梦境解析：用户可以在小程序中输入梦境内容，系统将根据关键词和后端算法进行梦境解析和寓意解读。
- 幸运签/运势：提供每日幸运签、运势等趣味功能，帮助用户获取每日正能量。
- 后端 API：Node.js 服务为小程序提供梦境解析、用户数据管理等接口，支持本地和 Docker 部署。

<img width="258" height="258" alt="image" src="https://github.com/user-attachments/assets/f42ef41a-9cba-4fa5-959d-2e53814b0980" />

<img width="258" height="258" alt="image" src="https://github.com/user-attachments/assets/f21f1c65-3e2b-4acd-a557-1b4e6c19a65d" />
<img width="258" height="258" alt="image" src="https://github.com/user-attachments/assets/3775996d-6632-41f3-a7e8-2075167b2b29" />


## 目录结构

```
miniprogram/           # 微信小程序前端代码
  app.js              # 小程序入口文件
  app.json            # 小程序全局配置
  app.wxss            # 小程序全局样式
  project.config.json # 项目配置文件
  images/             # 图片资源
  pages/              # 页面目录
    dream/            # 梦境相关页面
    index/            # 首页
    logs/             # 日志页面
  utils/              # 工具函数
    api.js            # API 请求封装
    util.js           # 通用工具函数

server/                # Node.js 后端服务
  Dockerfile           # Docker 配置
  package.json         # 后端依赖配置
  server.js            # 后端服务入口

.gitignore             # Git 忽略文件
```

## 使用说明

### 小程序端
1. 使用微信开发者工具导入 `miniprogram/` 目录。
2. 配置好项目的 AppID。
3. 运行并调试小程序。

### 后端服务
1. 进入 `server/` 目录：
   ```bash
   cd server
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 启动服务：
   ```bash
   node server.js
   ```
4. 可选：使用 Docker 部署后端服务。

## 贡献
欢迎提交 issue 和 PR。

## License
MIT
