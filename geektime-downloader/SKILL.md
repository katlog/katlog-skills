---
name: geektime-downloader
description: |
  极客时间课程下载与整理专家。自动识别课程类型（图文/视频），选择对应处理流程。
  触发场景：
  - "下载极客时间"、"下载课程"、"geektime"
  - "抓取课程"、"保存课程"、"课程笔记"
  - "下载视频课程"、"转录视频"、"视频转文字"
  - 用户提供极客时间课程URL时自动激活
---

# 极客时间课程下载与整理

## 概述

统一处理极客时间的图文课程和视频课程，自动识别类型并选择对应流程。

## 课程类型识别

根据URL格式自动判断：

| 类型 | URL格式 | 处理方式 |
|------|---------|----------|
| 图文课程 | `/column/intro/{id}` 或 `/column/article/{id}` | WebFetch + Markdown转换 |
| 视频课程 | `/course/intro/{id}` 或 `/course/detail/{id}-{aid}` | Playwright + 转录 |

## 前置条件

1. **已购买课程**：用户需有极客时间付费账号
2. **图文课程**：无额外依赖
3. **视频课程**：需 Chrome调试模式、FFmpeg、playwright、faster-whisper

---

## 图文课程处理流程

### 第一步：创建项目结构

```bash
mkdir -p {project_name}/{chapters,images}
```

### 第二步：下载章节内容

对每个章节URL使用 WebFetch：

```
WebFetch: https://time.geekbang.org/column/article/{article_id}
提示词: 提取文章完整内容，包括标题、正文、代码块、图片URL
```

### 第三步：转换格式

将HTML转为Markdown：
- 保留代码块语法高亮
- 转换表格为Markdown表格
- 在正文前添加3-5个核心知识点总结

### 第四步：下载图片

```bash
curl -o images/{章节号}-fig{序号}.{ext} "{image_url}"
```

更新Markdown中的图片引用为本地路径。

### 第五步：生成章节文件

```markdown
# {序号}｜{标题}

> 原文链接：https://time.geekbang.org/column/article/{article_id}

## 重点总结
- **要点1**：简要说明
- **要点2**：简要说明

---

## 正文内容
{完整的课程内容}
```

### 第六步：生成README目录

```markdown
# {课程名称}

> 来源：极客时间 | 作者：{作者名}

## 目录

| 章节 | 标题 | 重点内容 |
|------|------|----------|
| [01](chapters/01-xxx.md) | 标题1 | 核心知识点 |
```

---

## 视频课程处理流程

### 第一步：启动Chrome调试模式

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# 在浏览器中登录极客时间并打开课程页面
```

### 第二步：创建项目结构

```bash
mkdir -p {project_name}/{videos,transcripts,summaries}
```

创建 `video_list.json` 元数据：

```json
{
  "course_id": "课程ID",
  "course_name": "课程名称",
  "author": "作者",
  "chapters": [
    {"index": 1, "aid": 778255, "title": "章节标题", "duration": "00:07:01"}
  ]
}
```

### 第三步：下载视频

```bash
python3 scripts/download_videos.py --config video_list.json --output videos/
```

工作原理：Playwright连接Chrome → 捕获m3u8和密钥 → FFmpeg下载合并

### 第四步：视频转录

```bash
python3 scripts/transcribe_videos.py --input videos/ --output transcripts/
```

工作原理：FFmpeg提取音频 → faster-whisper语音识别 → 输出JSON+TXT

### 第五步：生成总结

```bash
python3 scripts/generate_summaries.py --input transcripts/ --output summaries/
```

或让Claude读取转录文本生成结构化总结。

---

## 输出文件结构

### 图文课程

```
{project}/
├── README.md           # 课程目录
├── chapters/           # Markdown章节
│   └── 01-标题.md
└── images/             # 课程配图
```

### 视频课程

```
{project}/
├── README.md           # 课程目录
├── video_list.json     # 元数据
├── videos/             # MP4文件
├── transcripts/        # 转录文本
└── summaries/          # Markdown总结
```

---

## 脚本说明

| 脚本 | 用途 | 适用类型 |
|------|------|----------|
| `download_videos.py` | 下载加密视频 | 视频课程 |
| `transcribe_videos.py` | 语音转文字 | 视频课程 |
| `generate_summaries.py` | 生成Markdown总结 | 视频课程 |

详见 `scripts/` 目录。

---

## 常见问题

### 图文课程
- **内容获取不完整**：检查登录状态，分段获取长文章
- **图片下载失败**：记录失败URL，保留原始链接

### 视频课程
- **Chrome连接失败**：确保以调试模式启动，端口9222可用
- **m3u8获取失败**：手动点击播放按钮，检查登录状态
- **转录质量差**：使用更大的whisper模型 (medium/large-v3)

---

## 使用示例

### 图文课程
```
用户：帮我下载这个课程 https://time.geekbang.org/column/intro/100924801
AI：识别为图文课程，开始使用WebFetch获取内容...
```

### 视频课程
```
用户：下载这个视频课程 https://time.geekbang.org/course/intro/100767801
AI：识别为视频课程，请先启动Chrome调试模式...
```
