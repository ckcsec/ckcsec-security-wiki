import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'

// 从 Markdown 正文中提取首段纯文本，作为页面 description（供搜索引擎摘要使用）
const extractDescription = (srcDir: string, relativePath: string): string => {
  try {
    const raw = fs.readFileSync(path.join(srcDir, relativePath), 'utf-8')
    // 去掉 frontmatter
    const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '')
    for (let line of body.split('\n')) {
      line = line.trim()
      if (!line) continue
      if (/^(#|<|!\[|\||```|>|-{3,}|\*{3,}|:::)/.test(line)) continue // 跳过标题/HTML/图片/表格/代码块等
      const text = line
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // 图片
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接保留文字
        .replace(/[*`#>]/g, '') // 行内标记（保留下划线，避免破坏代码标识符）
        .trim()
      if (text.length < 10) continue
      return text.length > 150 ? text.slice(0, 147) + '...' : text
    }
  } catch {
    // 忽略读取失败，回退到站点默认描述
  }
  return ''
}

const zhNav = [
  { text: '主页', link: '/' },
  {
    text: '关于文库',
    items: [
      { text: '文库介绍', link: '/about/' },
      { text: '支持项目', link: '/about/support' },
      { text: '使用指南', link: '/about/使用指南' }
    ]
  },
  {
    text: 'web安全',
    items: [
      { text: '基础篇', link: '/web/basis/' },
      { text: '靶场篇', link: '/web/range/' },
      { text: '工具篇', link: '/web/tools/' },
      { text: '漏洞速递', link: '/web/cert/' },
      { text: '应急响应', link: '/web/emer/' },
      { text: '环境避坑', link: '/web/environment/' },
      { text: 'SRC', link: '/web/SRC/' }
    ]
  },
  {
    text: '区块链',
    items: [
      { text: '区块链入门', link: '/blockchain/' },
      { text: '区块链市场', link: '/blockchain/transaction' },
      { text: '区块链安全', link: '/blockchain/bug/' }
    ]
  },
  {
    text: '红蓝对抗',
    items: [
      { text: '流量隐匿', link: '/redteam/流量隐匿/' },
      { text: '免杀对抗', link: '/redteam/免杀对抗/' }
    ]
  },
  {
    text: 'CTF',
    items: [
      { text: 'Misc', link: '/ctf/Misc/' },
      { text: 'Web', link: '/ctf/Web/' },
      { text: 'Pwn', link: '/ctf/Pwn/' },
      { text: 'Crypto', link: '/ctf/Crypto/' },
      { text: 'Reverse', link: '/ctf/Reverse/' }
    ]
  },
  {
    text: '友情链接',
    items: [
      { text: '合作伙伴', link: '/cooperation/friend/' },
      { text: '安全项目', link: '/cooperation/recruit/' },
      { text: '开源项目', link: '/cooperation/project/' },
      { text: '自用黑科技', link: '/cooperation/hacking/' }
    ]
  }
]

const zhSidebar = {
  '/about/': [
    {
      text: '关于文库',
      items: [
        { text: '文库介绍', link: '/about/' },
        { text: '支持项目', link: '/about/support' },
        { text: '使用指南', link: '/about/使用指南' }
      ]
    }
  ],
  '/web/basis/': [
    {
      text: '基础篇',
      items: [
        { text: '安服工程师基础', link: '/web/basis/安服工程师基础' },
        { text: '弱口令漏洞', link: '/web/basis/弱口令漏洞' },
        { text: '文件上传漏洞', link: '/web/basis/文件上传漏洞' },
        { text: '文件包含漏洞', link: '/web/basis/文件包含漏洞' },
        { text: 'SQL注入漏洞', link: '/web/basis/SQL注入漏洞' },
        { text: 'XSS跨站脚本攻击', link: '/web/basis/XSS跨站脚本攻击' },
        { text: 'CSRF跨站请求伪造', link: '/web/basis/CSRF跨站请求伪造' },
        { text: 'SSRF服务端请求伪造', link: '/web/basis/SSRF服务端请求伪造' },
        { text: 'Linux提权总结', link: '/web/basis/Linux提权总结' },
        { text: '反弹shell备忘录', link: '/web/basis/反弹shell备忘录' },
        { text: 'JAVA内存马研究0到1', link: '/web/basis/JAVA内存马研究0到1' }
      ]
    }
  ],
  '/web/emer/': [
    {
      text: '应急响应篇',
      items: [
        { text: '安全加固指南', link: '/web/emer/安全加固指南' },
        { text: 'linux&windows应急响应', link: '/web/emer/linux&windows应急响应' }
      ]
    }
  ],
  '/web/range/': [
    {
      text: '靶场篇',
      items: [
        { text: 'Vulstudy靶场', link: '/web/range/Vulstudy靶场' },
        { text: 'DVWA通关笔记', link: '/web/range/DVWA通关笔记' },
        { text: 'sqli-labs通关笔记', link: '/web/range/sqli-labs通关笔记' },
        { text: 'upload-labs通关笔记', link: '/web/range/upload-labs通关笔记' },
        { text: 'Vulnhub-acid', link: '/web/range/Vulnhub-acid' },
        { text: 'Vulnhub-billub0x', link: '/web/range/Vulnhub-billub0x' },
        { text: 'Vulnhub-Breach1', link: '/web/range/Vulnhub-Breach1' },
        { text: 'Vulnhub-bulldog', link: '/web/range/Vulnhub-bulldog' },
        { text: 'Vulnhub-dc2', link: '/web/range/Vulnhub-dc2' },
        { text: 'Vulnhub-dc9', link: '/web/range/Vulnhub-dc9' },
        { text: 'VulnHub-Kioptrix3', link: '/web/range/VulnHub-Kioptrix3' },
        { text: 'Vulnhub-LazySysAdmin1', link: '/web/range/Vulnhub-LazySysAdmin1' },
        { text: 'Vulnhub-The-Ether', link: '/web/range/Vulnhub-The-Ether' }
      ]
    }
  ],
  '/web/tools/': [
    {
      text: '工具篇',
      items: [
        { text: 'Burpsuite安装破解', link: '/web/tools/Burpsuite安装破解' },
        { text: 'CobaltStrike的使用', link: '/web/tools/CobaltStrike的使用' },
        { text: 'Sqlmap的使用', link: '/web/tools/Sqlmap的使用' },
        { text: 'Nmap的使用', link: '/web/tools/Nmap的使用' },
        { text: 'AWVS的安装破解', link: '/web/tools/AWVS的安装破解' },
        { text: 'Nessus安装破解', link: '/web/tools/Nessus安装破解' },
        { text: 'meterpreter', link: '/web/tools/meterpreter' },
        { text: 'PowerShell攻击指南', link: '/web/tools/PowerShell攻击指南' }
      ]
    }
  ],
  '/web/cert/': [
    {
      text: '漏洞速递',
      items: [
        { text: '蓝凌EIS8.0前台文件上传', link: '/web/cert/蓝凌EIS8.0前台文件上传' },
        { text: '朗新天霁sTalent前台文件上传', link: '/web/cert/朗新天霁sTalent前台文件上传' },
        { text: '浙江宇视科技SQL注入', link: '/web/cert/浙江宇视科技SQL注入' },
        { text: '方略知识管理系统SQL注入', link: '/web/cert/方略知识管理系统SQL注入' }
      ]
    }
  ],
  '/blockchain/': [
    {
      text: '区块链',
      items: [
        { text: '区块链入门', link: '/blockchain/' },
        { text: '区块链市场', link: '/blockchain/transaction' },
        { text: '区块链安全', link: '/blockchain/bug/' }
      ]
    }
  ],
  '/blockchain/bug/': [
    {
      text: '区块链安全',
      items: [
        { text: '常见攻击手法详解', link: '/blockchain/bug/常见攻击手法详解' },
        { text: '历史攻击手法案例', link: '/blockchain/bug/历史攻击手法案例' },
        { text: '待完善', link: '/blockchain/bug/待完善' }
      ]
    }
  ],
  '/redteam/流量隐匿/': [
    {
      text: '流量隐匿',
      items: [
        { text: '基于代理池', link: '/redteam/流量隐匿/基于代理池' },
        { text: '基于云函数', link: '/redteam/流量隐匿/基于云函数' },
        { text: 'NDAY批量上线', link: '/redteam/流量隐匿/NDAY批量上线' }
      ]
    }
  ],
  '/redteam/免杀对抗/': [
    {
      text: '免杀对抗',
      items: [
        { text: '免杀技术探讨（一）', link: '/redteam/免杀对抗/免杀技术探讨（一）' }
      ]
    }
  ],
  '/cooperation/project/': [
    {
      text: '开源项目',
      items: [
        { text: 'NGCBot', link: '/cooperation/project/NGCBot' },
        { text: 'ckcsecwiki', link: '/cooperation/project/ckcsecwiki' }
      ]
    }
  ],
  '/cooperation/recruit/': [
    {
      text: '安全项目',
      items: [
        { text: '2025国护招聘', link: '/cooperation/recruit/2025国护招聘' },
        { text: '安全实习生招聘', link: '/cooperation/recruit/安全实习生招聘' },
        { text: '驻场安全服务工程师', link: '/cooperation/recruit/aqzc' }
      ]
    }
  ]
}

const enText: Record<string, string> = {
  '主页': 'Home',
  '关于文库': 'About',
  '文库介绍': 'Project',
  '支持项目': 'Support',
  '使用指南': 'Guide',
  'web安全': 'Web Security',
  '基础篇': 'Basics',
  '靶场篇': 'Labs',
  '工具篇': 'Tools',
  '漏洞速递': 'Vulnerability Notes',
  '应急响应': 'Incident Response',
  '应急响应篇': 'Incident Response',
  '环境避坑': 'Environment Notes',
  '区块链': 'Blockchain',
  '区块链入门': 'Blockchain Basics',
  '区块链市场': 'Blockchain Markets',
  '区块链安全': 'Blockchain Security',
  '红蓝对抗': 'Red Team',
  '流量隐匿': 'Traffic Concealment',
  '免杀对抗': 'AV Evasion',
  '友情链接': 'Links',
  '合作伙伴': 'Partners',
  '安全项目': 'Security Projects',
  '开源项目': 'Open Source Projects',
  '自用黑科技': 'Utilities',
  '安服工程师基础': 'Security Service Engineer Basics',
  '弱口令漏洞': 'Weak Password Vulnerabilities',
  '文件上传漏洞': 'File Upload Vulnerabilities',
  '文件包含漏洞': 'File Inclusion Vulnerabilities',
  'SQL注入漏洞': 'SQL Injection Vulnerabilities',
  'XSS跨站脚本攻击': 'XSS Attacks',
  'CSRF跨站请求伪造': 'CSRF Attacks',
  'SSRF服务端请求伪造': 'SSRF Attacks',
  'Linux提权总结': 'Linux Privilege Escalation',
  '反弹shell备忘录': 'Reverse Shell Notes',
  'JAVA内存马研究0到1': 'Java Memory Shell Research',
  '安全加固指南': 'Security Hardening Guide',
  'linux&windows应急响应': 'Linux and Windows Incident Response',
  'Vulstudy靶场': 'Vulstudy Lab',
  'DVWA通关笔记': 'DVWA Walkthrough',
  'sqli-labs通关笔记': 'sqli-labs Walkthrough',
  'upload-labs通关笔记': 'upload-labs Walkthrough',
  'Burpsuite安装破解': 'Burp Suite Installation',
  'CobaltStrike的使用': 'Using Cobalt Strike',
  'Sqlmap的使用': 'Using sqlmap',
  'Nmap的使用': 'Using Nmap',
  'AWVS的安装破解': 'AWVS Installation',
  'Nessus安装破解': 'Nessus Installation',
  'PowerShell攻击指南': 'PowerShell Attack Guide',
  '蓝凌EIS8.0前台文件上传': 'Landray EIS 8.0 Frontend File Upload',
  '朗新天霁sTalent前台文件上传': 'Longshine sTalent Frontend File Upload',
  '浙江宇视科技SQL注入': 'Uniview SQL Injection',
  '方略知识管理系统SQL注入': 'Fanglue KMS SQL Injection',
  '常见攻击手法详解': 'Common Attack Techniques',
  '历史攻击手法案例': 'Historical Attack Cases',
  '待完善': 'To Be Improved',
  '基于代理池': 'Proxy Pool Based Concealment',
  '基于云函数': 'Cloud Function Based Concealment',
  'NDAY批量上线': 'Batch N-day Deployment',
  '免杀技术探讨（一）': 'AV Evasion Techniques Part 1',
  '2025国护招聘': '2025 National Cyber Defense Recruitment',
  '安全实习生招聘': 'Security Intern Recruitment',
  '驻场安全服务工程师': 'On-site Security Service Engineer'
}

type NavItem = {
  text: string
  link?: string
  items?: NavItem[]
}

const translateText = (text: string) => enText[text] ?? text

const withEnglishPath = (link?: string) => {
  if (!link || link.startsWith('http')) return link
  if (link === '/') return '/en/'
  return link.startsWith('/en/') ? link : `/en${link}`
}

const localizeItems = (items: NavItem[]): NavItem[] =>
  items.map((item) => ({
    ...item,
    text: translateText(item.text),
    link: withEnglishPath(item.link),
    items: item.items ? localizeItems(item.items) : undefined
  }))

const localizeSidebar = (sidebar: Record<string, NavItem[]>) =>
  Object.fromEntries(
    Object.entries(sidebar).map(([base, items]) => [`/en${base}`, localizeItems(items)])
  )

const enNav = localizeItems(zhNav)
const enSidebar = localizeSidebar(zhSidebar)

const socialLinks = [
  { icon: 'github', link: 'https://github.com/ckcsec/wiki-vitepress' }
]

export default defineConfig({
  title: 'ckcsec',
  description: 'CKCsec安全研究院',
  lang: 'zh-CN',
  lastUpdated: true,
  srcExclude: ['superpowers/**'],
  head: [
    ['link', { rel: 'icon', href: 'https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/ckc.jpg' }],
    ['meta', { name: 'robots', content: 'index, follow' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'CKCsec Wiki' }],
    ['meta', { property: 'og:image', content: 'https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/ckc.jpg' }]
  ],
  transformPageData: (pageData, { siteConfig }) => {
    if (!pageData.description) {
      const desc = extractDescription(siteConfig.srcDir, pageData.relativePath)
      if (desc) pageData.description = desc
    }
  },
  transformHead: ({ pageData, siteConfig }) => {
    const isEn = pageData.relativePath.startsWith('en/')
    const urlPath = pageData.relativePath
      .replace(/(^|\/)index\.md$/, '$1')
      .replace(/\.md$/, '.html')
    const canonical = `https://wiki.ckcsec.com/${urlPath}`
    const title = pageData.title
      ? `${pageData.title} | CKCsec Wiki`
      : (siteConfig.site.title || 'CKCsec Wiki')
    const description = pageData.description || siteConfig.site.description
    return [
      ['link', { rel: 'canonical', href: canonical }],
      ['meta', { property: 'og:url', content: canonical }],
      ['meta', { property: 'og:locale', content: isEn ? 'en_US' : 'zh_CN' }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }]
    ]
  },
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN'
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      title: 'CKCsec Wiki',
      description: 'A security research knowledge base for practitioners',
      themeConfig: {
        nav: enNav,
        sidebar: enSidebar,
        outline: {
          label: 'On this page'
        },
        docFooter: {
          prev: 'Previous page',
          next: 'Next page'
        },
        lastUpdated: {
          text: 'Last updated'
        },
        darkModeSwitchLabel: 'Appearance',
        langMenuLabel: 'Change language',
        returnToTopLabel: 'Return to top',
        sidebarMenuLabel: 'Menu',
        socialLinks,
        footer: {
          message: 'Released under the MIT License',
          copyright: 'Copyright © 2021-2026 CKCsec'
        }
      }
    }
  },
  themeConfig: {
    nav: zhNav,
    sidebar: zhSidebar,
    outline: {
      label: '页面导航'
    },
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    lastUpdated: {
      text: '最后更新'
    },
    darkModeSwitchLabel: '切换深浅色模式',
    langMenuLabel: '切换语言',
    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    search: {
      provider: 'local'
    },
    socialLinks,
    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2021-2026'
    }
  },
  sitemap: {
    hostname: 'https://wiki.ckcsec.com'
  }
})
