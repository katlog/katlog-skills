---
name: feishu-docx-to-markdown
description: Convert Feishu docx links to local Markdown with preserved structure, normal tables, images, and embedded Sheet previews. Use when users ask to export, migrate, archive, or sync Feishu cloud documents (`my.feishu.cn/docx/...`) into local `.md` files while keeping formatting and media.
---

# Feishu Docx To Markdown

## Overview

Export Feishu docx documents to local Markdown by using Feishu runtime APIs instead of static HTML scraping.  
Preserve headings, paragraphs, lists, code blocks, normal tables, images, and embedded Sheet content.

## Workflow

1. Parse the docx URL and extract token.
2. Fetch doc block data from `/space/api/docx/pages/client_vars`.
3. Convert supported block types to Markdown.
4. Download image payloads from `/space/api/box/file/cdn_url/` and decrypt with AES-GCM.
5. Resolve embedded Sheet blocks and generate local preview images.
6. Write `document.md`, `images/`, and `meta.json`.

## Prerequisites

1. Ensure Node.js is available.
2. Ensure Playwright is installed in the current workspace:

```bash
npm install --prefix . playwright
```

## Run Export

Run:

```bash
node skills/feishu-docx-to-markdown/scripts/feishu-docx-to-md.mjs "<feishu_docx_url>" [output_dir]
```

Example:

```bash
node skills/feishu-docx-to-markdown/scripts/feishu-docx-to-md.mjs \
  "https://my.feishu.cn/docx/OxIrdx6y1ovGLixGLHqczQ5enrb" \
  "./output"
```

## Output

Expect:

1. `output/<doc-title>-<docId>/document.md`
2. `output/<doc-title>-<docId>/images/`
3. `output/<doc-title>-<docId>/meta.json`

## Rendering Policy

Apply this output policy:

1. Export `table` blocks as Markdown tables (copyable text).
2. Export `sheet` blocks as local preview images.
3. Keep the original Sheet link under each preview image.

See detailed mapping in [references/block-mapping.md](references/block-mapping.md).

## Validate Result

After export:

1. Check `meta.json` for image and sheet counts.
2. Check `document.md` for missing image markers (`#image-missing`).
3. Open one `sheet-xxx.png` to confirm it is table content, not a login page.

## Troubleshooting

1. Re-run with network-enabled environment when API requests fail.
2. Re-install Playwright when import fails.
3. Re-run export when output contains stale images from previous runs.

## Script

Primary script:

- `scripts/feishu-docx-to-md.mjs`
