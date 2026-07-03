# CKCsec Wiki

📖 **Language / 语言**

- 🇺🇸 [English](./README.md)
- 🇨🇳 [简体中文](./README_zh.md)

<p align="center">
  <img width="320" alt="CKCsec Security Research Institute" src="docs/public/images/ckcsec-logo.png" />
</p>

CKCsec Wiki is a cybersecurity knowledge base maintained by CKCsec Security Research Institute. It is built for security researchers, security service engineers, CTF players, red-team learners, and security enthusiasts. The project covers Web security, blockchain security, CTF, red-team topics, incident response, tool usage, environment notes, and security projects. Its goal is to preserve practical security knowledge in a form that is searchable, learnable, and shareable.

The project is built with VitePress. Chinese is the default site, and a complete English mirror is now available. The English documentation keeps the original article tree and page paths, so readers can switch languages without losing the current section structure.

## Online Access

- Chinese site: <https://wiki.ckcsec.com/>
- English site: <https://wiki.ckcsec.com/en/>
- GitHub repository: <https://github.com/ckcsec/ckcsec-security-wiki>

## Highlights

- **Full bilingual structure**: `docs/` contains the Chinese documentation, while `docs/en/` mirrors the same article tree in English.
- **Practical security knowledge**: topics include common vulnerabilities, lab walkthroughs, tool guides, vulnerability notes, incident response, blockchain security, CTF, and red-team research.
- **Open and maintainable**: both the site source and documentation are public for reading, searching, revision, and collaboration.
- **Static documentation deployment**: the site is built with VitePress and can be deployed to Vercel, GitHub Pages, Netlify, or other static hosting platforms.

## Project Structure

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

## Local Development

```bash
npm install
npm run docs:dev
```

Build the static site:

```bash
npm run docs:build
```

## Usage Notice

The content in this knowledge base is provided only for learning, research, and authorized security work. Any direct or indirect consequences or losses caused by spreading, modifying, or using the information are the responsibility of the user.

CKCsec Security Research Institute reserves the right to modify and interpret this knowledge base. When redistributing or referencing content, keep the original content complete, including copyright notices and attribution. Do not modify, remove, or use the content for commercial purposes without permission. Unless otherwise stated, articles are authored by ckcsec.

## Support

Maintaining a knowledge base takes time. If the project helps you, a GitHub Star is appreciated. You can also share it with people who may need these materials.

## Donate

If this project has been helpful to you, you are welcome to support its continued maintenance with a crypto donation. Every contribution helps keep the knowledge base alive.

- **Wallet address (EVM / ERC-20)**: `0xfb1283C1556C137A765e7e2A777Ad6C82eA9d6Db`

Thank you for your support. ❤️

## Follow Updates

The Chinese public account shares security updates and project news. International readers can watch the GitHub repository for changes.

## Acknowledgements

This project is powered by:

- [VitePress](https://vitepress.dev/)
- [vuejs/vitepress](https://github.com/vuejs/vitepress)
- [Vercel](https://vercel.com/)
