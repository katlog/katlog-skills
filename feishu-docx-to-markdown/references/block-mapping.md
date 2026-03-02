# Block Mapping

## Docx Block To Markdown

- `page`: Traverse children.
- `heading2`: Render as `##`.
- `heading3`: Render as `###`.
- `text`: Render inline attributed text.
- `bullet`: Render unordered list.
- `ordered`: Render ordered list.
- `code`: Render fenced code block.
- `divider`: Render `---`.
- `quote_container`: Render blockquote lines.
- `table`: Render Markdown table.
- `image`: Render local image link after download + decryption.
- `sheet`: Render local preview image + original Sheet URL.

## Image Handling

1. Call `/space/api/box/file/cdn_url/` with `file_token`.
2. Download encrypted bytes from returned `url`.
3. Decrypt with AES-GCM using `secret` and `nonce`.
4. Write decrypted bytes to `images/image-xxx.*`.

## Table Policy

1. Keep normal `table` blocks in Markdown for copyability.
2. Keep `sheet` blocks as images because they are embedded spreadsheet payloads.
