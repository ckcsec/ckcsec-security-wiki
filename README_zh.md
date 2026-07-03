# CKCsec Wiki

📖 **Language / 语言**

- 🇺🇸 [English](./README.md)
- 🇨🇳 [简体中文](./README_zh.md)

<img width="1570" height="862" alt="image" src="https://github.com/user-attachments/assets/62280133-704a-4918-ae32-0576fde1d032" />

CKCsec Wiki 是 CKCsec 安全研究院维护的网络安全知识文库，面向安全研究员、安全服务工程师、CTF 选手、红蓝对抗学习者和安全爱好者。项目内容覆盖 Web 安全、区块链安全、CTF、红蓝对抗、应急响应、工具使用、环境避坑与安全项目等方向，目标是把可检索、可学习、可共享的安全实践长期沉淀下来。

项目基于 VitePress 构建，中文站点为默认入口，同时已经建立完整英文站点镜像。英文文档保留原有文章树和页面路径，读者在中英文之间切换时不会丢失原有栏目结构。

## 在线访问

- 中文站点：<https://wiki.ckcsec.com/>
- English site：<https://wiki.ckcsec.com/en/>
- GitHub 仓库：<https://github.com/ckcsec/ckcsec-security-wiki>

## 项目特点

- **完整双语结构**：`docs/` 为中文文档，`docs/en/` 为英文镜像，英文站点与中文文章树保持一致。
- **安全知识沉淀**：覆盖基础漏洞、靶场记录、工具教程、漏洞速递、应急响应、区块链安全、CTF 与红队研究。
- **开源可维护**：站点源码和文档内容公开，便于阅读、检索、修订和协作。
- **静态文档部署**：使用 VitePress 构建，适合部署到 Vercel、GitHub Pages、Netlify 等静态托管平台。

## 目录结构

```text
docs/
├── .vitepress/          # VitePress 配置
├── en/                  # 英文文档镜像
├── about/               # 关于文库
├── blockchain/          # 区块链安全
├── cooperation/         # 合作、项目与招聘信息
├── ctf/                 # CTF 分类内容
├── redteam/             # 红蓝对抗
└── web/                 # Web 安全、工具、靶场、应急响应等
```

## 本地运行

```bash
npm install
npm run docs:dev
```

构建静态站点：

```bash
npm run docs:build
```

## 使用须知

本文库内容仅用于学习、研究与授权安全工作。由于传播、修改、利用本文库所提供的信息而造成的任何直接或间接后果及损失，均由使用者本人负责，文章作者不承担相关责任。

CKCsec 安全研究院拥有对此文库的修改和解释权。如需转载或传播本文库内容，请保证内容完整，包括版权声明等全部信息。未经作者允许，不得任意修改、增减文章内容，也不得以任何方式将其用于商业目的。文章中如无特殊声明，默认作者为 ckcsec。

## 支持项目

写博客和维护文库长期处在用爱发电的状态。如果你觉得内容对你有帮助，可以点击 Star 支持项目，也可以把它推荐给需要这些资料的朋友。

<p align="center">
  <img src="https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/3809119fc70a889dc5cc3a458f698db4_720.jpg" width="50%" alt="支持 CKCsec Wiki" />
</p>

## 打赏支持

如果本项目对你有帮助，也欢迎通过加密货币打赏支持项目的长期维护，每一份支持都会让文库走得更远。

- **钱包地址（EVM / ERC-20）**：`0xfb1283C1556C137A765e7e2A777Ad6C82eA9d6Db`

感谢你的支持。❤️

## 关注公众号

关注公众号，快速获取安全相关资讯与项目更新动态。

<p align="center">
  <img src="https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/gif.gif" width="50%" alt="CKCsec 公众号" />
</p>

## 鸣谢

感谢以下项目作为本文库的核心技术支撑：

- [VitePress](https://vitepress.dev/)
- [vuejs/vitepress](https://github.com/vuejs/vitepress)
- [Vercel](https://vercel.com/)
