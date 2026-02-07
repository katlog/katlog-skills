#!/usr/bin/env python3
"""
视频转文字脚本 - 使用 faster-whisper
"""
import json
import subprocess
import re
import argparse
from pathlib import Path

try:
    from faster_whisper import WhisperModel
except ImportError:
    print("请安装 faster-whisper: pip install faster-whisper")
    exit(1)


def extract_audio(video_path, audio_path):
    cmd = [
        "ffmpeg", "-y", "-i", str(video_path),
        "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
        str(audio_path)
    ]
    return subprocess.run(cmd, capture_output=True).returncode == 0


def transcribe_video(model, video_path):
    audio_path = video_path.with_suffix(".wav")
    print(f"  提取音频...")
    if not extract_audio(video_path, audio_path):
        print(f"  ✗ 音频提取失败")
        return None

    print(f"  转录中...")
    try:
        segments, info = model.transcribe(
            str(audio_path), language="zh", beam_size=5, vad_filter=True
        )
        full_text = []
        timestamps = []
        for segment in segments:
            text = segment.text.strip()
            if text:
                full_text.append(text)
                timestamps.append({
                    "start": segment.start, "end": segment.end, "text": text
                })
        audio_path.unlink(missing_ok=True)
        return {
            "text": "".join(full_text),
            "timestamps": timestamps,
            "language": info.language,
            "duration": info.duration
        }
    except Exception as e:
        print(f"  ✗ 转录失败: {e}")
        audio_path.unlink(missing_ok=True)
        return None


def main():
    parser = argparse.ArgumentParser(description='视频转文字')
    parser.add_argument('--input', required=True, help='视频目录')
    parser.add_argument('--output', required=True, help='转录输出目录')
    parser.add_argument('--config', help='video_list.json (可选)')
    parser.add_argument('--model', default='medium',
                        choices=['tiny', 'base', 'small', 'medium', 'large-v3'])
    parser.add_argument('--device', default='cpu', choices=['cpu', 'cuda'])
    args = parser.parse_args()

    input_dir = Path(args.input)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    chapter_info = {}
    if args.config:
        with open(args.config) as f:
            for ch in json.load(f)["chapters"]:
                chapter_info[ch["index"]] = ch

    print(f"加载模型: {args.model}...")
    compute_type = "int8" if args.device == "cpu" else "float16"
    model = WhisperModel(args.model, device=args.device, compute_type=compute_type)
    print("模型加载完成")

    videos = sorted(input_dir.glob("*.mp4"))
    print(f"找到 {len(videos)} 个视频")

    for video_path in videos:
        match = re.match(r"(\d+)_", video_path.name)
        if not match:
            continue
        chapter_idx = int(match.group(1))
        chapter = chapter_info.get(chapter_idx, {"title": video_path.stem})

        print(f"\n{'='*60}")
        print(f"第 {chapter_idx} 章: {chapter.get('title', video_path.stem)}")
        print(f"{'='*60}")

        transcript_path = output_dir / f"{chapter_idx:02d}_transcript.json"
        if transcript_path.exists():
            print(f"  ✓ 已转录，跳过")
            continue

        result = transcribe_video(model, video_path)
        if result:
            output = {
                "chapter": chapter_idx,
                "title": chapter.get("title", ""),
                "video_file": video_path.name,
                "duration": result["duration"],
                "language": result["language"],
                "text": result["text"],
                "timestamps": result["timestamps"]
            }
            with open(transcript_path, "w", encoding="utf-8") as f:
                json.dump(output, f, ensure_ascii=False, indent=2)
            print(f"  ✓ 转录完成: {len(result['text'])} 字")

            text_path = output_dir / f"{chapter_idx:02d}_transcript.txt"
            with open(text_path, "w", encoding="utf-8") as f:
                f.write(f"# {chapter.get('title', '')}\n\n{result['text']}")

    print(f"\n{'='*60}\n转录完成!\n{'='*60}")


if __name__ == "__main__":
    main()
