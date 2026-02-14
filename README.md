# katlog-skills

个人收集和创建的 Claude Code Skills。

## 本仓库 Skills

| Skill | 描述 |
|-------|------|
| [tech-diagram](./tech-diagram/) | 技术图表绘制工具，支持架构图、流程图、ER 图、时序图、动画演示等，基于 Mermaid 和 SVG |
| [geektime-downloader](./geektime-downloader/) | 极客时间课程下载与整理，自动识别课程类型（图文/视频），支持视频转录和内容摘要 |

## 常用 Skills（已安装）

以下是推荐安装的常用 Skills，可以使用 `./install-skills.sh` 一键安装：

### 核心开发工具

| Skill | 描述 | 仓库 |
|-------|------|------|
| **superpowers** | 完整的 AI 编程工作流框架，包含头脑风暴、计划编写、TDD、代码审查等完整开发流程 | [obra/superpowers](https://github.com/obra/superpowers) |
| **planning-with-files** | 用 Markdown 文件作为 AI 外部记忆，解决上下文丢失问题，适合复杂项目 | [OthmanAdi/planning-with-files](https://github.com/OthmanAdi/planning-with-files) |
| **vercel-labs-skills** | Vercel 官方 Skills 工具集，包含 find-skills 等实用工具 | [vercel-labs/skills](https://github.com/vercel-labs/skills) |

### 文档处理

| Skill | 描述 | 来源 |
|-------|------|------|
| **pdf** | PDF 处理工具包，支持文本提取、表格提取、PDF 创建、合并/拆分、表单填写等 | Anthropic 官方 |
| **pptx** | PowerPoint 演示文稿创建、编辑和分析工具 | Anthropic 官方 |

### 前端开发

| Skill | 描述 | 来源 |
|-------|------|------|
| **frontend-design** | 创建独特的生产级前端界面，避免千篇一律的 AI 风格，支持 Web 组件、页面、应用等 | Anthropic 官方 |
| **remotion-best-practices** | Remotion 视频动画制作最佳实践 | 社区 |
| **webapp-testing** | Web 应用测试工具 | 社区 |

### 工具类

| Skill | 描述 | 来源 |
|-------|------|------|
| **skill-creator** | Anthropic 官方的 Skill 创建工具，帮助创建自定义 Skills | Anthropic 官方 |
| **changelog-generator** | 自动生成变更日志 | 社区 |
| **prototype-prompt-generator** | 原型提示词生成器 | 社区 |

### 本仓库 Skills

| Skill | 描述 | 来源 |
|-------|------|------|
| **tech-diagram** | 技术图表绘制工具，支持架构图、流程图、ER 图、时序图、动画演示等 | 本地 |
| **geektime-downloader** | 极客时间课程下载与整理工具 | 本地 |
| **codeagent** | 多后端 AI 代码任务执行工具 | 本地 |
| **codex** | Codex 相关工具 | 本地 |

### 快速安装

```bash
# 一键安装所有常用 Skills（从 GitHub）
./install-skills.sh

# 或者手动安装单个 Skill
cd ~/.claude/skills
git clone https://github.com/obra/superpowers.git
git clone https://github.com/OthmanAdi/planning-with-files.git
git clone https://github.com/vercel-labs/skills.git vercel-labs-skills
```

**注意：** Anthropic 官方的 skills（pdf、pptx、frontend-design 等）需要通过 Anthropic 官方渠道安装。

## 推荐的 Skills 库

- [jiamu-skills](https://github.com/isjiamu/jiamu-skills) - 小红书上看到的一个作者，包含多个实用 skill
- [anthropic-skills](https://github.com/anthropics/claude-code-skills) - Anthropic 官方 Skills 仓库
- [mushan-skills](https://github.com/nicepkg/claude-code-skills) - 社区维护的 Skills 合集
- [myclaude](https://github.com/cexll/myclaude) - cexll 的 Claude Code Skills 集合

## Agent Skills 精选资源

### 入门教程
- [鱼皮的 Agent Skills 保姆级入门教程](https://www.bilibili.com/video/BV1T7zzBQEaA/) - 从零开始讲解 Agent Skills 的概念、安装使用、内部原理和创建方法
- [吴恩达 × Anthropic 官方课程](https://www.deeplearning.ai/short-courses/agent-skills-with-anthropic/) - DeepLearning.AI 和 Anthropic 联合出品的 Skills 最佳实践课程
- [鱼皮的 AI 编程零基础教程](https://ai.codefather.cn/vibe) - 涵盖 Claude Code、Cursor、Agent Skills、MCP 等工具的完整教程

### 安装管理工具
- [skills CLI](https://www.npmjs.com/package/skills) - Vercel 官方命令行工具，一行命令安装任何 Skills
- [Skill Seeker](https://github.com/yusufkaraaslan/Skill_Seekers) - 自动抓取文档、GitHub 仓库、PDF 并转换成 Agent Skills
- [everything-claude-code](https://github.com/affaan-m/everything-claude-code) - Anthropic 黑客松冠军的完整配置集合

### 在线市场
- [skills.sh](https://skills.sh) - Vercel 官方 Skills 排行榜，支持一键安装
- [鱼皮 AI 导航 - Skills 专区](https://ai.codefather.cn/skills) - 中文 Agent Skills 导航网站
- [skillsmp](https://skillsmp.com/zh) - 自动抓取 GitHub 上所有 Skills 项目
- [MCP Market](https://mcpmarket.com/daily/skills) - 每日 Skills 热门榜单

### 开源合集
- [anthropics/skills](https://github.com/anthropics/skills) - Anthropic 官方 Skills，包含文档处理、前端设计、MCP 构建等
- [awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) - 最全的 Skills 精选列表
- [openai/skills](https://github.com/openai/skills) - OpenAI 官方的 Codex Skills 目录
- [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) - Vercel 出品的 React/Next.js 最佳实践
- [expo/skills](https://github.com/expo/skills) - Expo 官方的 React Native 开发 Skills
- [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) - Obsidian 知识管理 Skills
- [stripe/ai](https://github.com/stripe/ai) - Stripe 官方金融支付相关 Skills
- [trailofbits/skills](https://github.com/trailofbits/skills) - Trail of Bits 安全研究和漏洞检测 Skills（20+ 个安全插件）
- [Notion Skills](https://www.notion.so/notiondevs/Notion-Skills-for-Claude-28da4445d27180c7af1df7d8615723d0) - Notion 官方 Skills

### 必备推荐

#### 项目开发
- [superpowers](https://github.com/obra/superpowers) - 完整的 AI 编程技能框架和软件开发方法论
- [planning-with-files](https://github.com/OthmanAdi/planning-with-files) - 用 Markdown 文件作为 AI 外部记忆，解决上下文丢失问题
- [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) - 专业前端设计 Skill
- [vue-skills](https://github.com/vuejs-ai/skills) - Vue.js 最佳实践 Skills（尤雨溪团队成员维护）
- [supabase-postgres-best-practices](https://github.com/supabase/agent-skills) - Supabase 出品的 PostgreSQL 数据库最佳实践

#### 浏览器自动化
- [browser-use](https://github.com/browser-use/browser-use) - 让 AI Agent 能访问和操作网站
- [agent-browser](https://github.com/vercel-labs/agent-browser) - Vercel 出品的浏览器自动化 Skill

#### 内容创作
- [remotion-dev/skills](https://github.com/remotion-dev/skills) - Remotion 官方视频动画制作 Skills
- [baoyu-skills](https://github.com/JimLiu/baoyu-skills) - 宝玉老师的 Skills 集合（公众号写作、PPT 制作、封面图生成等）
- [humanizer](https://github.com/blader/humanizer) - 去除 AI 生成痕迹的 Skill
- [heygen-com/skills](https://github.com/heygen-com/skills) - HeyGen 官方 AI 数字人视频生成 Skills

#### Skills 管理工具
- find-skills - Vercel 出品的 Skills 发现工具（通过 `npx skills add vercel-labs/skills` 安装）
- skill-creator - Anthropic 官方的 Skill 创建工具（通过 `npx skills add anthropics/skills` 安装）

#### 网站审计
- [seo-audit](https://github.com/coreyhaines31/marketingskills) - SEO 审计 Skill（含 25+ 个营销相关技能）
- [audit-website](https://github.com/squirrelscan/skills) - 网站安全审计 Skill（230+ 条审计规则）

### 官方文档
- [Anthropic 官方文档](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/overview) - Agent Skills 技术细节和最佳实践
- [Agent Skills 开放标准](https://agentskills.io) - Anthropic 主导的开放标准网站
- [Claude Skills 博客](https://claude.com/blog/skills) - Anthropic 官方博客
- [Skills API 快速入门](https://docs.claude.com/en/api/skills-guide) - 通过 API 使用 Skills 的文档

## MCP 服务器推荐

### 网页与搜索
- [Firecrawl MCP](https://www.firecrawl.dev/) - 网页内容抓取和理解
- [Brave Search MCP](https://github.com/brave/brave-search-mcp-server) - 注重隐私保护的网络搜索
- [Context7](https://context7.com/) - 获取最新技术文档
- [Web to MCP](https://web-to-mcp.com/) - Chrome 扩展，复刻网页 UI 组件

### 开发与调试
- [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) - Chrome 官方浏览器调试工具
- [GitHub MCP](https://github.com/github/github-mcp-server) - GitHub 官方代码仓库管理工具

### 部署与存储
- [EdgeOne Pages MCP](https://github.com/TencentEdgeOne/edgeone-pages-mcp) - 腾讯云一键部署工具
- [COS MCP](https://github.com/Tencent/cos-mcp) - 腾讯云对象存储操作工具

## IDE 扩展插件推荐

### AI 编程助手
- Claude Code 官方扩展 - 在 VS Code/Cursor 中直接使用 Claude Code
- Cline - 类似 Claude Code 的 AI 编程助手
- GitHub Copilot - GitHub 官方 AI 编程助手

### 开发工具
- [GitLens](https://www.gitkraken.com/gitlens) - Git 可视化工具，支持 AI 功能
- [Office Viewer](https://github.com/cweijan/vscode-office) - 编辑器内文档预览（支持 Markdown、Excel、Word、PDF 等）
- [ESLint](https://eslint.org/) - JavaScript/TypeScript 代码质量检查
- [Prettier](https://prettier.io/) - 代码格式化工具

## 参考资源

- [20 个神级 AI 编程扩展（上）](https://www.bilibili.com/opus/1159812552060829704) - 程序员鱼皮的 MCP 服务器和 IDE 扩展推荐
- [40 个 Agent Skills 精选资源](https://www.bilibili.com/opus/1168397122198831120) - 程序员鱼皮的 Agent Skills 完整指南
