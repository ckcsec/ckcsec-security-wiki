# CKCsec Wiki

<p align="center">
  <a href="#中文">中文</a> | <a href="#english">English</a>
</p>

<img width="1570" height="862" alt="image" src="https://github.com/user-attachments/assets/62280133-704a-4918-ae32-0576fde1d032" />

## 中文

CKCsec Wiki 是 CKCsec 安全研究院维护的网络安全知识文库，面向安全研究员、安全服务工程师、CTF 选手、红蓝对抗学习者和安全爱好者。项目内容覆盖 Web 安全、区块链安全、CTF、红蓝对抗、应急响应、工具使用、环境避坑与安全项目等方向，目标是把可检索、可学习、可共享的安全实践长期沉淀下来。

项目基于 VitePress 构建，中文站点为默认入口，同时已经建立完整英文站点镜像。英文文档保留原有文章树和页面路径，读者在中英文之间切换时不会丢失原有栏目结构。

### 在线访问

- 中文站点：<https://wiki.ckcsec.cn/>
- English site：<https://wiki.ckcsec.cn/en/>
- GitHub 仓库：<https://github.com/ckcsec/wiki-vitepress>

### 项目特点

- **完整双语结构**：`docs/` 为中文文档，`docs/en/` 为英文镜像，英文站点与中文文章树保持一致。
- **安全知识沉淀**：覆盖基础漏洞、靶场记录、工具教程、漏洞速递、应急响应、区块链安全、CTF 与红队研究。
- **开源可维护**：站点源码和文档内容公开，便于阅读、检索、修订和协作。
- **静态文档部署**：使用 VitePress 构建，适合部署到 Vercel、GitHub Pages、Netlify 等静态托管平台。

### 目录结构

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

### 本地运行

```bash
npm install
npm run docs:dev
```

构建静态站点：

```bash
npm run docs:build
```

### 使用须知

本文库内容仅用于学习、研究与授权安全工作。由于传播、修改、利用本文库所提供的信息而造成的任何直接或间接后果及损失，均由使用者本人负责，文章作者不承担相关责任。

CKCsec 安全研究院拥有对此文库的修改和解释权。如需转载或传播本文库内容，请保证内容完整，包括版权声明等全部信息。未经作者允许，不得任意修改、增减文章内容，也不得以任何方式将其用于商业目的。文章中如无特殊声明，默认作者为 ckcsec。

### 支持项目

写博客和维护文库长期处在用爱发电的状态。如果你觉得内容对你有帮助，可以点击 Star 支持项目，也可以把它推荐给需要这些资料的朋友。

<p align="center">
  <img src="https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/3809119fc70a889dc5cc3a458f698db4_720.jpg" width="50%" alt="支持 CKCsec Wiki" />
</p>

### 关注公众号

关注公众号，快速获取安全相关资讯与项目更新动态。

<p align="center">
  <img src="https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/gif.gif" width="50%" alt="CKCsec 公众号" />
</p>

### 鸣谢

感谢以下项目作为本文库的核心技术支撑：

- [VitePress](https://vitepress.dev/)
- [vuejs/vitepress](https://github.com/vuejs/vitepress)
- [Vercel](https://vercel.com/)

## English

CKCsec Wiki is a cybersecurity knowledge base maintained by CKCsec Security Research Institute. It is built for security researchers, security service engineers, CTF players, red-team learners, and security enthusiasts. The project covers Web security, blockchain security, CTF, red-team topics, incident response, tool usage, environment notes, and security projects. Its goal is to preserve practical security knowledge in a form that is searchable, learnable, and shareable.

The project is built with VitePress. Chinese is the default site, and a complete English mirror is now available. The English documentation keeps the original article tree and page paths, so readers can switch languages without losing the current section structure.

### Online Access

- Chinese site: <https://wiki.ckcsec.cn/>
- English site: <https://wiki.ckcsec.cn/en/>
- GitHub repository: <https://github.com/ckcsec/wiki-vitepress>

### Highlights

- **Full bilingual structure**: `docs/` contains the Chinese documentation, while `docs/en/` mirrors the same article tree in English.
- **Practical security knowledge**: topics include common vulnerabilities, lab walkthroughs, tool guides, vulnerability notes, incident response, blockchain security, CTF, and red-team research.
- **Open and maintainable**: both the site source and documentation are public for reading, searching, revision, and collaboration.
- **Static documentation deployment**: the site is built with VitePress and can be deployed to Vercel, GitHub Pages, Netlify, or other static hosting platforms.

### Project Structure

```text
docs/
├── .vitepress/          # VitePress configuration
├── en/                  # English documentation mirror
├── about/               # About the wiki
├── blockchain/          # Blockchain security
├── cooperation/         # Partners, projects, and recruitment
├── ctf/                 # CTF categories
├── redteam/             # Red-team and blue-team topics
└── web/                 # Web security, tools, labs, incident response, and more
```

### Local Development

```bash
npm install
npm run docs:dev
```

Build the static site:

```bash
npm run docs:build
```

### Usage Notice

The content in this knowledge base is provided only for learning, research, and authorized security work. Any direct or indirect consequences or losses caused by spreading, modifying, or using the information are the responsibility of the user.

CKCsec Security Research Institute reserves the right to modify and interpret this knowledge base. When redistributing or referencing content, keep the original content complete, including copyright notices and attribution. Do not modify, remove, or use the content for commercial purposes without permission. Unless otherwise stated, articles are authored by ckcsec.

### Support

Maintaining a knowledge base takes time. If the project helps you, a GitHub Star is appreciated. You can also share it with people who may need these materials.

### Follow Updates

The Chinese public account shares security updates and project news. International readers can watch the GitHub repository for changes.

### Acknowledgements

This project is powered by:

- [VitePress](https://vitepress.dev/)
- [vuejs/vitepress](https://github.com/vuejs/vitepress)
- [Vercel](https://vercel.com/)
