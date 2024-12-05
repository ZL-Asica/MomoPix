# MomoPix

> **MomoPix** 是一个轻量、易于搭建的个人图床工具，名字取自日语中的“桃 ( もも )”，意为“桃子”。  
> 基于 Cloudflare Pages, R2 作为储存空间，为你提供简洁、优雅的图床体验！🎉

[![GitHub License][license-badge]][license-link]
[![Node.js][node-badge]][node-link] |
[![React][react-badge]][react-link]
[![Vite][vite-badge]][vite-link] |
[![Cloudflare][cloudflare-badge]][cloudflare-link]
[![Firebase][firebase-badge]][firebase-link]
[![pnpm Version][pnpm-badge]][pnpm-link]
[![Eslint][eslint-badge]][eslint-link]
[![Prettier][prettier-badge]][prettier-link]

> 🚧 **本项目仍在开发中，部署文档尚未编写完成，请暂时勿用于生产环境。**

---

## WIP

- [x] 基本功能实现（上传、删除、查看、复制链接、相册管理）
- [x] 完善前端界面（主题、样式、交互）
- [x] 完善后端逻辑（上传、删除、查看）
- [x] 移除单独的后端服务，改为 Cloudflare Pages Functions
- [ ] 移除 Firebase 依赖，改为 Cloudflare KV 存储
- [ ] 完善文档，编写部署指南

---

## ✨ 功能亮点

- **📂 快速上传**：支持拖拽上传，简洁明了的操作界面。
- **🌐 多种格式链接**：一键复制直链、HTML、Markdown 或 BBCode 格式链接。
- **🔒 安全**：基于 Cloudflare 的存储与 Hono 框架，轻松部署，安全可靠。
- **📸 相簿管理**：分类管理你的图片，自定义相簿名称与封面。
- **🎨 自定义外观**：灵活的样式与主题支持，打造专属体验。

---

## 📦 技术栈

- **前端**：
  - [React](https://react.dev/) ⚛️
  - [Vite](https://vite.dev/) ⚡
  - [MUI](https://mui.com/)：懒 🖌️
- **后端**：
  - [Cloudflare](https://www.cloudflare.com/)：感谢大善人🙏
- **开发工具**：
  - [pnpm](https://pnpm.io/) 🚀
  - [ESLint][eslint-link] 🔍
  - [Prettier][prettier-link] 🎨

---

## 🛠️ 项目结构

```plaintext
MomoPix/
.
├── src
│   ├── App.tsx                      # React 应用主入口
│   ├── AppProviders.tsx             # 全局 Provider 管理
│   ├── api                          # API 调用模块
│   ├── assets                       # 静态资源
│   ├── components                   # 可复用组件
│   │   ├── Albums                   # 相册相关组件
│   │   ├── SingleAlbum              # 单个相册页面组件
│   │   ├── SinglePhoto              # 单张图片相关组件
│   │   └── common                   # 通用组件
│   ├── hooks
│   │   ├── useAuthContext.ts        # 全局 Context
│   │   ├── usePagination.ts         # 分页逻辑
│   │   └── useUpdateUserData        # 用户数据更新逻辑
│   ├── pages
│   │   ├── Albums.tsx               # 相册页（首页）
│   │   ├── Profile.tsx              # 用户资料页
│   │   ├── SignIn.tsx               # 登录页
│   │   ├── SignUp.tsx               # 注册页
│   │   └── SingleAlbum.tsx          # 单个相册页面
│   ├── utils                        # 工具函数
│   │   ├── copyPhotoLinks.ts        # 图片链接复制工具
│   │   ├── image                    # 图片相关工具
│   │   └── theme.ts                 # 主题配置
│   ├── consts.ts                    # 常量定义
│   ├── types                        # 全局类型定义
│   │   ├── api.d.ts                 # API 类型
│   │   └── userData.d.ts            # 用户数据类型
│   └── firebase-config.ts           # Firebase 配置
├── functions                        # Cloudflare Pages Functions
│   └── api                          # 后端逻辑
│       ├── upload.ts                # 图片上传处理
│       └── delete.ts                # 图片删除处理
├── public                           # 静态资源
│   └── favicon.ico                  # 网站图标
├── package.json                     # 项目依赖和脚本
├── vite.config.ts                   # Vite 配置
├── README.md                        # 项目说明
└── LICENSE                          # 开源协议
```

---

## 🚀 快速开始

1. 克隆项目：

   ```bash
   git clone https://github.com/ZL-Asica/MomoPix.git
   cd MomoPix
   ```

2. 安装依赖：

   ```bash
   pnpm install
   ```

3. 本地启动开发环境：

   ```bash
   pnpm dev
   ```

4. 构建项目：

   ```bash
   pnpm build
   ```

5. 预览生产环境：

   ```bash
   pnpm preview
   ```

---

## 🔗 链接与文档

- [官方文档](https://github.com/ZL-Asica/MomoPix/README.md) 📚 文档编写中
- [常见问题](https://github.com/ZL-Asica/MomoPix/issues) ❓
<!-- - [贡献指南](https://github.com/ZL-Asica/MomoPix/blob/main/CONTRIBUTING.md) 🛠️ -->

<!-- Badges -->

[cloudflare-badge]: https://img.shields.io/badge/Cloudflare-F38020?logo=Cloudflare&logoColor=white
[cloudflare-link]: https://www.cloudflare.com/
[eslint-badge]: https://img.shields.io/badge/eslint-4B32C3?logo=eslint&logoColor=white
[eslint-link]: https://www.npmjs.com/package/eslint-config-zl-asica
[firebase-badge]: https://img.shields.io/badge/-Firebase-FFCA28?logo=firebase&logoColor=black
[firebase-link]: https://firebase.google.com/
[license-badge]: https://img.shields.io/github/license/ZL-Asica/MomoPix
[license-link]: https://github.com/ZL-Asica/MomoPix/blob/main/LICENSE
[node-badge]: https://img.shields.io/badge/node%3E=18.18-339933?logo=node.js&logoColor=white
[node-link]: https://nodejs.org/
[pnpm-badge]: https://img.shields.io/github/package-json/packageManager/ZL-Asica/MomoPix?label=&logo=pnpm&logoColor=fff&color=F69220
[pnpm-link]: https://pnpm.io/
[prettier-badge]: https://img.shields.io/badge/Prettier-F7B93E?logo=Prettier&logoColor=white
[prettier-link]: https://www.npmjs.com/package/@zl-asica/prettier-config
[react-badge]: https://img.shields.io/badge/React-%2320232a.svg?logo=react&logoColor=%2361DAFB
[react-link]: https://react.dev/
[vite-badge]: https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=fff
[vite-link]: https://vite.dev/
