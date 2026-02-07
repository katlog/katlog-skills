#!/usr/bin/env python3
"""
极客时间视频课程下载器
通过Playwright连接Chrome调试端口，捕获m3u8和密钥，使用FFmpeg下载
"""
import asyncio
import json
import subprocess
import re
import argparse
from pathlib import Path
from playwright.async_api import async_playwright


class GeekTimeDownloader:
    def __init__(self, config_path, output_dir, base_url):
        self.config_path = Path(config_path)
        self.output_dir = Path(output_dir)
        self.base_url = base_url
        self.browser = None
        self.page = None
        self.context = None
        self.m3u8_content = None
        self.m3u8_url = None
        self.key_url = None
        self.key_content = None

    async def connect(self, port=9222):
        """连接到Chrome调试端口"""
        self.playwright = await async_playwright().start()
        try:
            self.browser = await self.playwright.chromium.connect_over_cdp(
                f"http://localhost:{port}"
            )
            print(f"✓ 成功连接Chrome (端口 {port})")

            contexts = self.browser.contexts
            if not contexts:
                print("✗ 未找到浏览器上下文")
                return False

            self.context = contexts[0]
            pages = self.context.pages

            for page in pages:
                if "time.geekbang.org" in page.url:
                    self.page = page
                    print(f"✓ 找到目标页面: {page.url[:50]}...")
                    break

            if not self.page and pages:
                self.page = pages[0]

            return True

        except Exception as e:
            print(f"✗ 连接失败: {e}")
            print("  请确保Chrome以调试模式启动:")
            print("  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222")
            return False

    async def close(self):
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def navigate_and_capture(self, aid):
        """导航到视频页面并捕获m3u8"""
        url = f"{self.base_url}{aid}"
        print(f"  导航到: {url}")

        self.m3u8_content = None
        self.m3u8_url = None
        self.key_url = None
        self.key_content = None

        async def handle_response(response):
            resp_url = response.url
            if ".m3u8" in resp_url and "media" in resp_url:
                try:
                    text = await response.text()
                    if "#EXTINF" in text:
                        self.m3u8_content = text
                        self.m3u8_url = resp_url
                        print(f"  ✓ 获取到m3u8 ({len(text)} 字节)")
                        key_match = re.search(
                            r'#EXT-X-KEY:METHOD=AES-128,URI="([^"]+)"', text
                        )
                        if key_match:
                            self.key_url = key_match.group(1)
                            print(f"  ✓ 找到Key URL")
                except:
                    pass

            if "decrypt" in resp_url and "kms" in resp_url:
                try:
                    body = await response.body()
                    if len(body) == 16:
                        self.key_content = body
                        print(f"  ✓ 捕获到密钥")
                except:
                    pass

        self.page.on("response", handle_response)

        try:
            await self.page.goto(url, wait_until="networkidle", timeout=30000)
            await asyncio.sleep(2)

            try:
                play_btn = await self.page.query_selector(
                    '.play-btn, .video-play-btn, [class*="play-icon"]'
                )
                if play_btn:
                    await play_btn.click()
                    print("  ✓ 点击播放按钮")
                    await asyncio.sleep(3)
            except:
                pass

            for _ in range(10):
                if self.m3u8_content:
                    break
                await asyncio.sleep(1)

        finally:
            self.page.remove_listener("response", handle_response)

        return self.m3u8_content is not None

    async def get_key(self):
        if not self.key_url:
            return None
        try:
            result = await self.page.evaluate(f'''
                async () => {{
                    try {{
                        const resp = await fetch("{self.key_url}", {{credentials: 'include'}});
                        const buffer = await resp.arrayBuffer();
                        const bytes = new Uint8Array(buffer);
                        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
                    }} catch(e) {{
                        return 'error: ' + e.message;
                    }}
                }}
            ''')
            if result and not result.startswith("error"):
                self.key_content = bytes.fromhex(result)
                print(f"  ✓ 获取到密钥")
                return self.key_content
        except Exception as e:
            print(f"  ✗ 获取密钥异常: {e}")
        return None

    def create_local_m3u8(self, key_path, output_path):
        if not self.m3u8_content:
            return None
        lines = self.m3u8_content.split('\n')
        new_lines = []
        base_url = self.m3u8_url.rsplit('/', 1)[0] + "/" if self.m3u8_url else None

        for line in lines:
            if line.startswith('#EXT-X-KEY'):
                new_lines.append(f'#EXT-X-KEY:METHOD=AES-128,URI="{key_path}"')
            elif line.endswith('.ts'):
                if line.startswith('http'):
                    new_lines.append(line)
                elif base_url:
                    new_lines.append(base_url + line)
                else:
                    new_lines.append(line)
            else:
                new_lines.append(line)

        with open(output_path, 'w') as f:
            f.write('\n'.join(new_lines))
        return output_path

    def download_video(self, m3u8_path, output_path):
        cmd = [
            "ffmpeg", "-y",
            "-protocol_whitelist", "file,http,https,tcp,tls,crypto",
            "-allowed_extensions", "ALL",
            "-i", str(m3u8_path),
            "-c", "copy",
            str(output_path)
        ]
        print(f"  下载中...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            size_mb = output_path.stat().st_size / 1024 / 1024
            print(f"  ✓ 下载成功: {size_mb:.1f} MB")
            return True
        print(f"  ✗ 下载失败")
        return False

    async def download_chapter(self, chapter):
        index = chapter["index"]
        aid = chapter["aid"]
        title = chapter["title"]

        print(f"\n{'='*60}")
        print(f"第 {index} 章: {title}")
        print(f"{'='*60}")

        safe_title = re.sub(r'[^\w\u4e00-\u9fff]+', '_', title)
        video_filename = f"{index:02d}_{safe_title}.mp4"
        video_path = self.output_dir / video_filename

        if video_path.exists():
            print(f"  ✓ 已存在，跳过")
            return True

        if not await self.navigate_and_capture(aid):
            print("  ✗ 无法获取m3u8")
            return False

        key_content = self.key_content
        if not key_content and self.key_url:
            key_content = await self.get_key()

        if key_content:
            key_path = self.output_dir / f"{index:02d}_key.bin"
            with open(key_path, 'wb') as f:
                f.write(key_content)
        else:
            print("  ✗ 无法获取密钥")
            return False

        m3u8_local = self.output_dir / f"{index:02d}_temp.m3u8"
        self.create_local_m3u8(str(key_path), m3u8_local)
        success = self.download_video(m3u8_local, video_path)

        m3u8_local.unlink(missing_ok=True)
        key_path.unlink(missing_ok=True)
        return success

    async def run(self, start_from=1, end_at=None):
        self.output_dir.mkdir(parents=True, exist_ok=True)

        with open(self.config_path) as f:
            data = json.load(f)

        chapters = data["chapters"]
        total = len(chapters)

        if end_at:
            chapters = [c for c in chapters if start_from <= c["index"] <= end_at]
        else:
            chapters = [c for c in chapters if c["index"] >= start_from]

        print(f"\n课程: {data['course_name']}")
        print(f"共 {total} 章，本次下载 {len(chapters)} 章")
        print(f"保存目录: {self.output_dir}")

        if not await self.connect():
            return

        success_count = 0
        failed_chapters = []

        for chapter in chapters:
            try:
                if await self.download_chapter(chapter):
                    success_count += 1
                else:
                    failed_chapters.append(chapter["index"])
            except Exception as e:
                print(f"  ✗ 异常: {e}")
                failed_chapters.append(chapter["index"])
            await asyncio.sleep(2)

        await self.close()

        print(f"\n{'='*60}")
        print(f"下载完成! 成功: {success_count}/{len(chapters)}")
        if failed_chapters:
            print(f"失败章节: {failed_chapters}")
        print(f"{'='*60}")


async def main():
    parser = argparse.ArgumentParser(description='下载极客时间视频课程')
    parser.add_argument('--config', required=True, help='video_list.json 配置文件')
    parser.add_argument('--output', default='videos', help='视频输出目录')
    parser.add_argument('--base-url', required=True, help='课程详情页URL前缀')
    parser.add_argument('--start', type=int, default=1, help='从第几章开始')
    parser.add_argument('--end', type=int, help='到第几章结束')
    parser.add_argument('--port', type=int, default=9222, help='Chrome调试端口')
    args = parser.parse_args()

    downloader = GeekTimeDownloader(args.config, args.output, args.base_url)
    await downloader.run(start_from=args.start, end_at=args.end)


if __name__ == "__main__":
    asyncio.run(main())
