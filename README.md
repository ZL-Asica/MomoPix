# MomoPix

> **MomoPix** 是一个轻量、易于搭建的个人图床工具，名字取自日语中的“桃 ( もも )”，意为“桃子”。
> 基于 Cloudflare Worker, R2 作为储存空间，为你提供简洁、优雅的图床体验！🎉

[![GitHub License][license-badge]][license-link] [![Latest Release][release-badge]][release-link]

[![Node.js][node-badge]][node-link] [![pnpm Version][pnpm-badge]][pnpm-link] | [![Tailwind CSS][tailwind-badge]][tailwind-link] | [![Cloudflare][cloudflare-badge]][cloudflare-link] [![Eslint][eslint-badge]][eslint-link] [![Prettier]

> 🚧 **本项目仍在开发中（重构中），部署文档尚未编写完成，请暂时勿用于生产环境。**

---

## WIP

- [ ] 重构中...

---

## ✨ 功能亮点

- **📂 快速上传**：支持拖拽上传，简洁明了的操作界面。
- **🌐 多种格式链接**：一键复制直链、HTML、Markdown 或 BBCode 格式链接。
- **🔒 安全**：基于 Cloudflare 的 R2 存储与 Cloudflare Workers 框架，轻松部署，安全可靠。
- **📸 相簿管理**：分类管理你的图片，自定义相簿名称与封面。
- **🎨 自定义外观**：灵活的样式与主题支持，打造专属体验。

---

## 📦 技术栈

- **核心**：
  - [Tanstack Start](https://tanstack.com/start) ⚡
  - [Tailwind CSS](https://tailwindcss.com/) 🖌️
  - [Cloudflare](https://www.cloudflare.com/)：感谢大善人🙏
- **开发工具**：
  - [pnpm](https://pnpm.io/) 🚀
  - [ESLint][eslint-link] 🔍

---

## 🛠️ 项目结构

```plaintext
MomoPix/
.
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
[license-badge]: https://img.shields.io/github/license/ZL-Asica/MomoPix
[license-link]: https://github.com/ZL-Asica/MomoPix/blob/main/LICENSE
[node-badge]: https://img.shields.io/badge/node%3E=18.18-339933?logo=node.js&logoColor=white
[node-link]: https://nodejs.org/
[pnpm-badge]: https://img.shields.io/github/package-json/packageManager/ZL-Asica/MomoPix?label=&logo=pnpm&logoColor=fff&color=F69220
[pnpm-link]: https://pnpm.io/
[release-badge]: https://img.shields.io/github/v/release/ZL-Asica/MomoPix?display_name=release&label=MomoPix&color=fc8da3
[release-link]: https://github.com/ZL-Asica/MomoPix/releases
[tailwind-badge]: https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white
[tailwind-link]: https://tailwindcss.com/
