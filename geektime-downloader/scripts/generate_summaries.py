#!/usr/bin/env python3
"""
生成章节总结 Markdown 文件
"""
import json
import re
import argparse
from pathlib import Path


def generate_summary_md(data, course_name="视频课程"):
    chapter = data["chapter"]
    title = data["title"]
    text = data["text"]
    duration = data.get("duration", 0)

    minutes = int(duration // 60)
    seconds = int(duration % 60)

    sentences = re.split(r'(?<=[。！？])', text)
    sentences = [s.strip() for s in sentences if s.strip()]

    paragraphs = []
    current = []
    for i, s in enumerate(sentences):
        current.append(s)
        if len(current) >= 4 or i == len(sentences) - 1:
            paragraphs.append("".join(current))
            current = []

    md = f"""# {title}

**课程**: {course_name}
**章节**: 第{chapter}章
**时长**: {minutes}:{seconds:02d}

---

## 内容概要

{text[:500]}...

---

## 详细内容

"""
    for para in paragraphs:
        md += f"{para}\n\n"

    md += "\n---\n\n## 关键要点\n\n*（基于转录内容提取的关键信息）*\n"
    return md


def main():
    parser = argparse.ArgumentParser(description='生成章节总结')
    parser.add_argument('--input', required=True, help='转录文件目录')
    parser.add_argument('--output', required=True, help='总结输出目录')
    parser.add_argument('--config', help='video_list.json (可选)')
    args = parser.parse_args()

    input_dir = Path(args.input)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    course_name = "视频课程"
    if args.config:
        with open(args.config) as f:
            data = json.load(f)
            course_name = data.get("course_name", course_name)
            print(f"课程: {course_name}")

    for tf in sorted(input_dir.glob("*_transcript.json")):
        with open(tf, encoding="utf-8") as f:
            data = json.load(f)

        chapter = data["chapter"]
        title = data["title"]
        print(f"生成第{chapter}章总结: {title[:30]}...")

        md = generate_summary_md(data, course_name)
        safe_title = re.sub(r'[^\w\u4e00-\u9fff]+', '_', title)
        output_path = output_dir / f"{chapter:02d}_{safe_title}.md"

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(md)
        print(f"  ✓ {output_path.name}")

    print("\n总结生成完成!")


if __name__ == "__main__":
    main()
