#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";
import zlib from "node:zlib";
import { chromium } from "playwright";

function usage() {
  console.log(
    "Usage: node scripts/feishu-docx-to-md.mjs <feishu_doc_url> [output_dir]"
  );
}

function parseDocToken(urlStr) {
  const u = new URL(urlStr);
  const m = u.pathname.match(/\/docx\/([A-Za-z0-9]+)/);
  if (!m) {
    throw new Error(`Invalid Feishu docx URL: ${urlStr}`);
  }
  return m[1];
}

function sanitizeName(name) {
  return name
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function base36ToInt(s) {
  if (!s) return 0;
  return parseInt(s, 36);
}

function detectExtByBytes(buf) {
  if (buf.length >= 8 && buf.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") {
    return ".png";
  }
  if (buf.length >= 3 && buf.subarray(0, 3).toString("hex") === "ffd8ff") {
    return ".jpg";
  }
  if (buf.length >= 12 && buf.subarray(0, 4).toString("ascii") === "RIFF") {
    return ".webp";
  }
  if (buf.length >= 6) {
    const head = buf.subarray(0, 6).toString("ascii");
    if (head === "GIF87a" || head === "GIF89a") return ".gif";
  }
  return ".bin";
}

function extByMime(mime) {
  const m = (mime || "").toLowerCase();
  if (m === "image/png") return ".png";
  if (m === "image/jpeg" || m === "image/jpg") return ".jpg";
  if (m === "image/webp") return ".webp";
  if (m === "image/gif") return ".gif";
  if (m === "image/svg+xml") return ".svg";
  return "";
}

function escapeMarkdownText(text) {
  return text.replace(/\\/g, "\\\\").replace(/([*_`[\]|])/g, "\\$1");
}

function escapeMarkdownTableCell(text) {
  return escapeMarkdownText(text).replace(/\n/g, "<br>");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapCodeInline(text) {
  if (!text.includes("`")) return `\`${text}\``;
  if (!text.includes("``")) return `\`\`${text}\`\``;
  return `\`\`\`${text}\`\`\``;
}

function parseOpChunks(attribStr) {
  const re = /((?:\*[0-9a-z]+)*)(?:\|([0-9a-z]+))?([+=-])([0-9a-z]+)/g;
  const ops = [];
  let m;
  let consumed = 0;
  while ((m = re.exec(attribStr)) !== null) {
    if (m.index !== consumed) return null;
    consumed = re.lastIndex;
    ops.push({
      attrsSpec: m[1] || "",
      lineCount: base36ToInt(m[2] || "0"),
      op: m[3],
      count: base36ToInt(m[4]),
    });
  }
  if (consumed !== attribStr.length) return null;
  return ops;
}

function attrsFromSpec(attrsSpec, numToAttrib) {
  const out = {};
  const re = /\*([0-9a-z]+)/g;
  let m;
  while ((m = re.exec(attrsSpec)) !== null) {
    const idx = String(base36ToInt(m[1]));
    const pair = numToAttrib?.[idx];
    if (!Array.isArray(pair) || pair.length < 2) continue;
    const [name, val] = pair;
    out[name] = val === "true" ? true : val;
  }
  return out;
}

function decodeAttributedSegments(textObj) {
  const textMap = textObj?.initialAttributedTexts?.text || {};
  const attribMap = textObj?.initialAttributedTexts?.attribs || {};
  const numToAttrib = textObj?.apool?.numToAttrib || {};
  const keys = Object.keys(textMap).sort((a, b) => Number(a) - Number(b));
  const segments = [];

  for (const k of keys) {
    const text = String(textMap[k] ?? "");
    const attribStr = String(attribMap[k] ?? "");
    if (!attribStr) {
      if (text) segments.push({ text, marks: {} });
      continue;
    }

    const ops = parseOpChunks(attribStr);
    if (!ops) {
      if (text) segments.push({ text, marks: {} });
      continue;
    }

    let pos = 0;
    for (const op of ops) {
      if (!Number.isFinite(op.count) || op.count <= 0) continue;
      if (op.op === "-") {
        pos += op.count;
        continue;
      }
      const chunk = text.slice(pos, pos + op.count);
      pos += op.count;
      if (!chunk) continue;
      const marks = attrsFromSpec(op.attrsSpec, numToAttrib);
      segments.push({ text: chunk, marks });
    }
    if (pos < text.length) {
      segments.push({ text: text.slice(pos), marks: {} });
    }
  }

  return segments;
}

function renderInline(textObj, { plain = false } = {}) {
  const segments = decodeAttributedSegments(textObj);
  if (!segments.length) return "";

  const rendered = segments.map((seg) => {
    const raw = seg.text.replace(/\u200b/g, "");
    if (!raw) return "";
    if (plain) return raw;

    const marks = seg.marks || {};
    const codeLike = marks.inlineCode || marks.textHighlightBackground;
    let out = codeLike ? wrapCodeInline(raw) : escapeMarkdownText(raw);
    if (marks.bold) out = `**${out}**`;
    if (marks.italic) out = `*${out}*`;
    return out;
  });

  return rendered.join("");
}

function renderCodeText(textObj) {
  return renderInline(textObj, { plain: true }).replace(/\u200b/g, "");
}

function normalizeLanguage(lang) {
  const l = (lang || "").trim();
  if (!l) return "";
  if (/^plain\s*text$/i.test(l)) return "";
  return l.toLowerCase();
}

function indentLines(text, indent) {
  const p = "  ".repeat(indent);
  return text
    .split("\n")
    .map((line) => `${p}${line}`)
    .join("\n");
}

function readVarint(buf, offset) {
  let res = 0;
  let shift = 0;
  let pos = offset;
  for (let i = 0; i < 10; i += 1) {
    if (pos >= buf.length) return null;
    const b = buf[pos];
    pos += 1;
    res |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) return { value: res >>> 0, next: pos };
    shift += 7;
  }
  return null;
}

function looksProto(buf) {
  const v = readVarint(buf, 0);
  if (!v) return false;
  const wt = v.value & 7;
  return wt === 0 || wt === 1 || wt === 2 || wt === 5;
}

function cleanProtoString(s) {
  return s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "").trim();
}

function extractProtoStrings(buf, out = [], depth = 0) {
  if (depth > 12) return out;
  let off = 0;
  while (off < buf.length) {
    const key = readVarint(buf, off);
    if (!key) break;
    off = key.next;
    const wt = key.value & 7;

    if (wt === 0) {
      const v = readVarint(buf, off);
      if (!v) break;
      off = v.next;
      continue;
    }
    if (wt === 1) {
      off += 8;
      continue;
    }
    if (wt === 5) {
      off += 4;
      continue;
    }
    if (wt !== 2) break;

    const lenV = readVarint(buf, off);
    if (!lenV) break;
    off = lenV.next;
    const len = lenV.value;
    if (off + len > buf.length) break;
    const chunk = buf.subarray(off, off + len);
    off += len;

    const sub = [];
    if (looksProto(chunk)) {
      extractProtoStrings(chunk, sub, depth + 1);
    }
    if (sub.length) {
      out.push(...sub);
      continue;
    }

    const s = cleanProtoString(chunk.toString("utf8"));
    if (!s) continue;
    out.push(s);
  }
  return out;
}

function parseSheetToken(token) {
  const i = token.indexOf("_");
  if (i <= 0 || i >= token.length - 1) return { rootToken: token, sheetId: "" };
  return {
    rootToken: token.slice(0, i),
    sheetId: token.slice(i + 1),
  };
}

function buildTableMarkdown(tableBlock, blockMap) {
  const d = tableBlock?.data || {};
  const rows = d.rows_id || [];
  const cols = d.columns_id || [];
  if (!rows.length || !cols.length) return "";

  const matrix = rows.map((rowId) =>
    cols.map((colId) => {
      const cell = d.cell_set?.[`${rowId}${colId}`];
      if (!cell?.block_id) return "";
      const cellBlock = blockMap.get(cell.block_id);
      if (!cellBlock) return "";
      const parts = [];
      for (const childId of cellBlock.data?.children || []) {
        const child = blockMap.get(childId);
        if (!child) continue;
        const t = child.data?.type;
        if (t === "text" || t === "heading2" || t === "heading3" || t === "bullet" || t === "ordered") {
          parts.push(renderInline(child.data?.text).trim());
        } else if (t === "code") {
          parts.push(renderCodeText(child.data?.text).trim());
        }
      }
      return parts.join("<br>").trim();
    })
  );

  const header = matrix[0].map((c) => escapeMarkdownTableCell(c || " "));
  const sep = cols.map(() => "---");
  const lines = [];
  lines.push(`| ${header.join(" | ")} |`);
  lines.push(`| ${sep.join(" | ")} |`);
  for (let i = 1; i < matrix.length; i += 1) {
    const row = matrix[i].map((c) => escapeMarkdownTableCell(c || " "));
    lines.push(`| ${row.join(" | ")} |`);
  }
  return lines.join("\n");
}

async function fetchClientVarsPage(page, docId, cursor = "") {
  const u = new URL("https://my.feishu.cn/space/api/docx/pages/client_vars");
  u.searchParams.set("id", docId);
  u.searchParams.set("mode", "7");
  u.searchParams.set("limit", "239");
  if (cursor) u.searchParams.set("cursor", cursor);
  const resp = await page.request.get(u.toString(), {
    headers: { accept: "application/json, text/plain, */*" },
  });
  const json = await resp.json();
  if (json?.code !== 0 || !json?.data) {
    throw new Error(`client_vars failed: ${JSON.stringify(json).slice(0, 500)}`);
  }
  return json.data;
}

async function loadDocData(page, docId) {
  const first = await fetchClientVarsPage(page, docId, "");
  const pages = [first];
  for (const c of first.next_cursors || []) {
    pages.push(await fetchClientVarsPage(page, docId, c));
  }

  const blockMap = new Map();
  const blockSequence = [];
  for (const p of pages) {
    for (const [id, blk] of Object.entries(p.block_map || {})) {
      blockMap.set(id, blk);
    }
    for (const id of p.block_sequence || []) {
      blockSequence.push(id);
    }
  }

  return {
    blockMap,
    blockSequence,
    rootId: docId,
    structureVersion: first.structure_version,
  };
}

function decryptImageAesGcm(cipherBuf, secretB64, nonceB64) {
  const key = Buffer.from(secretB64, "base64");
  const iv = Buffer.from(nonceB64, "base64");
  const tag = cipherBuf.subarray(cipherBuf.length - 16);
  const enc = cipherBuf.subarray(0, cipherBuf.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]);
}

function collectImagesInOrder(rootId, blockMap) {
  const seen = new Set();
  const ordered = [];

  function walk(id) {
    if (!id || seen.has(id)) return;
    seen.add(id);
    const blk = blockMap.get(id);
    if (!blk) return;
    if (blk.data?.type === "image" && blk.data?.image?.token) {
      ordered.push({ id, block: blk });
    }
    for (const c of blk.data?.children || []) walk(c);
    if (blk.data?.type === "table") {
      const cellSet = blk.data?.cell_set || {};
      for (const c of Object.values(cellSet)) {
        if (c?.block_id) walk(c.block_id);
      }
    }
  }

  walk(rootId);
  return ordered;
}

function collectSheetBlocksInOrder(rootId, blockMap) {
  const seen = new Set();
  const ordered = [];

  function walk(id) {
    if (!id || seen.has(id)) return;
    seen.add(id);
    const blk = blockMap.get(id);
    if (!blk) return;
    if (blk.data?.type === "sheet" && blk.data?.token) {
      ordered.push({ id, block: blk });
    }
    for (const c of blk.data?.children || []) walk(c);
    if (blk.data?.type === "table") {
      const cellSet = blk.data?.cell_set || {};
      for (const c of Object.values(cellSet)) {
        if (c?.block_id) walk(c.block_id);
      }
    }
  }

  walk(rootId);
  return ordered;
}

async function downloadAndDecryptImages(page, imageBlocks, assetsDirAbs, assetsDirRel) {
  await fs.mkdir(assetsDirAbs, { recursive: true });
  const mapByBlockId = new Map();
  if (!imageBlocks.length) return mapByBlockId;

  const reqItems = imageBlocks.map((x) => ({
    file_token: x.block.data.image.token,
    width: Number(x.block.data.image.width) || 2048,
    height: Number(x.block.data.image.height) || 2048,
    policy: "near",
  }));

  const urlResp = await page.request.post("https://my.feishu.cn/space/api/box/file/cdn_url/", {
    data: reqItems,
    headers: { "content-type": "application/json" },
  });
  const urlJson = await urlResp.json();
  if (urlJson?.code !== 0 || !Array.isArray(urlJson?.data)) {
    throw new Error(`box/file/cdn_url failed: ${JSON.stringify(urlJson).slice(0, 500)}`);
  }

  const infoByToken = new Map();
  for (const it of urlJson.data) {
    if (it?.file_token) infoByToken.set(it.file_token, it);
  }

  let index = 1;
  for (const item of imageBlocks) {
    const img = item.block.data?.image || {};
    const token = img.token;
    const info = infoByToken.get(token);
    if (!info?.url || !info?.secret || !info?.nonce) continue;

    const encResp = await page.request.get(info.url);
    const encBuf = Buffer.from(await encResp.body());
    const plainBuf = decryptImageAesGcm(encBuf, info.secret, info.nonce);

    const ext = extByMime(img.mimeType) || detectExtByBytes(plainBuf);
    const fileName = `image-${String(index).padStart(3, "0")}${ext}`;
    const abs = path.join(assetsDirAbs, fileName);
    await fs.writeFile(abs, plainBuf);
    mapByBlockId.set(item.id, `${assetsDirRel}/${fileName}`);
    index += 1;
  }

  return mapByBlockId;
}

async function captureSheetPreviews(page, sheetBlocks, assetsDirAbs, assetsDirRel) {
  const mapByBlockId = new Map();
  if (!sheetBlocks.length) return mapByBlockId;

  await fs.mkdir(assetsDirAbs, { recursive: true });
  let index = 1;

  async function fetchSheetSnapshot(rootToken, sheetId) {
    return page.evaluate(
      async ({ rootToken: rt, sheetId: sid }) => {
        const cookieMap = Object.fromEntries(
          document.cookie.split("; ").map((s) => {
            const i = s.indexOf("=");
            return [decodeURIComponent(s.slice(0, i)), decodeURIComponent(s.slice(i + 1))];
          })
        );
        const csrf = cookieMap._csrf_token || "";
        const payload = {
          memberId: 0,
          schemaVersion: 9,
          openType: 1,
          token: rt,
          sheetRange: { sheetId: sid },
          clientVersion: "v0.0.1",
        };
        const r = await fetch("/space/api/v3/sheet/client_vars", {
          method: "POST",
          credentials: "include",
          headers: {
            "content-type": "application/json",
            "x-csrftoken": csrf,
            "doc-platform": "web",
            "doc-os": "mac",
            "doc-biz": "Lark",
            "x-command": "api.sheet.rce.msg",
          },
          body: JSON.stringify(payload),
        });
        const j = await r.json();
        if (j?.code !== 0 || !j?.data?.snapshot) return null;
        return {
          snapshot: j.data.snapshot,
          schemaVersion: j.data.schemaVersion || 9,
        };
      },
      { rootToken, sheetId }
    );
  }

  function buildSheetMatrix(snapshot, sheetId) {
    const metaJson = zlib
      .gunzipSync(Buffer.from(snapshot.gzipBlockMeta, "base64"))
      .toString("utf8");
    const meta = JSON.parse(metaJson);
    const info = meta[sheetId];
    if (!info?.cellBlockMetas?.length) return [];
    const metas = [...info.cellBlockMetas].sort((a, b) => {
      if (a.range.rowStart !== b.range.rowStart) return a.range.rowStart - b.range.rowStart;
      return a.range.colStart - b.range.colStart;
    });

    let rowMax = 0;
    let colMax = 0;
    for (const m of metas) {
      rowMax = Math.max(rowMax, Number(m.range.rowEnd) || 0);
      colMax = Math.max(colMax, Number(m.range.colEnd) || 0);
    }
    if (rowMax <= 0 || colMax <= 0) return [];
    const matrix = Array.from({ length: rowMax }, () => Array.from({ length: colMax }, () => ""));

    for (const m of metas) {
      const blockB64 = snapshot.blocks?.[m.blockId];
      if (!blockB64) continue;
      const blockBuf = zlib.gunzipSync(Buffer.from(blockB64, "base64"));
      const rawStrings = extractProtoStrings(blockBuf, []);
      const filtered = rawStrings.filter((s) => {
        if (!s) return false;
        if (s === sheetId) return false;
        if (/^rgb\(/i.test(s)) return false;
        if (/^block_[A-Za-z0-9_]+$/.test(s)) return false;
        if (/^[A-Za-z0-9_-]{20,}$/.test(s)) return false;
        if (/^[()]+$/.test(s)) return false;
        if (/^\d+\nrgb\(/.test(s)) return false;
        return true;
      });

      const rs = Number(m.range.rowStart) || 0;
      const re = Number(m.range.rowEnd) || 0;
      const cs = Number(m.range.colStart) || 0;
      const ce = Number(m.range.colEnd) || 0;
      const need = Math.max(0, (re - rs) * (ce - cs));
      const cells = filtered.slice(0, need);
      let p = 0;
      for (let r = rs; r < re; r += 1) {
        for (let c = cs; c < ce; c += 1) {
          matrix[r][c] = cells[p] || "";
          p += 1;
        }
      }
    }

    return matrix;
  }

  async function renderMatrixImage(matrix, title, absPath) {
    const rows = matrix.length ? matrix : [["(表格内容解析失败)"]];
    const cols = rows[0]?.length || 1;
    const tableRows = rows
      .map((row, r) => {
        const cells = Array.from({ length: cols }, (_, c) => escapeHtml(row[c] || ""));
        const tds = cells
          .map((cell) => {
            const tag = r === 0 ? "th" : "td";
            return `<${tag}>${cell || "&nbsp;"}</${tag}>`;
          })
          .join("");
        return `<tr>${tds}</tr>`;
      })
      .join("");

    const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  body { margin: 0; padding: 24px; background: #fff; color: #1f2329; font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif; }
  .title { font-size: 15px; color: #4e5969; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 13px; }
  th, td { border: 1px solid #d9dde4; padding: 8px 10px; vertical-align: top; word-wrap: break-word; }
  th { background: #f5f7fa; font-weight: 600; }
</style></head><body>
  <div class="title">${escapeHtml(title)}</div>
  <table>${tableRows}</table>
</body></html>`;

    const p = await page.context().newPage();
    try {
      await p.setViewportSize({ width: 1200, height: 800 });
      await p.setContent(html, { waitUntil: "domcontentloaded" });
      await p.waitForTimeout(100);
      await p.screenshot({ path: absPath, fullPage: true });
    } finally {
      await p.close();
    }
  }

  for (const item of sheetBlocks) {
    const token = item.block.data?.token || "";
    const sheetUrl = token ? `https://my.feishu.cn/sheets/${token}` : "";
    const fileName = `sheet-${String(index).padStart(3, "0")}.png`;
    const abs = path.join(assetsDirAbs, fileName);
    const rel = `${assetsDirRel}/${fileName}`;
    let captured = false;

    try {
      const { rootToken, sheetId } = parseSheetToken(token);
      if (rootToken && sheetId) {
        const sheetData = await fetchSheetSnapshot(rootToken, sheetId);
        if (sheetData?.snapshot) {
          const matrix = buildSheetMatrix(sheetData.snapshot, sheetId);
          await renderMatrixImage(matrix, `飞书 Sheet：${sheetId}`, abs);
          captured = true;
        }
      }
    } catch {
      captured = false;
    }

    mapByBlockId.set(item.id, {
      imagePath: captured ? rel : "",
      sheetUrl,
    });
    index += 1;
  }

  return mapByBlockId;
}

function buildMarkdown(rootId, blockMap, imagePathMap, sheetPreviewMap) {
  const root = blockMap.get(rootId);
  const parts = [];
  const title = renderInline(root?.data?.text, { plain: true }).trim();
  if (title) parts.push(`# ${escapeMarkdownText(title)}`);

  function renderBlock(id, ctx = {}) {
    const blk = blockMap.get(id);
    if (!blk) return;
    const d = blk.data || {};
    const t = d.type;

    if (t === "text") {
      const txt = renderInline(d.text).trimEnd();
      parts.push(ctx.quote ? `> ${txt}` : txt);
      return;
    }
    if (t === "heading2") {
      const txt = renderInline(d.text).trim();
      parts.push(`## ${txt}`);
      return;
    }
    if (t === "heading3") {
      const txt = renderInline(d.text).trim();
      parts.push(`### ${txt}`);
      return;
    }
    if (t === "divider") {
      parts.push("---");
      return;
    }
    if (t === "code") {
      const lang = normalizeLanguage(d.language);
      const code = renderCodeText(d.text).replace(/\u200b/g, "");
      parts.push(`\`\`\`${lang}\n${code}\n\`\`\``);
      return;
    }
    if (t === "bullet") {
      const txt = renderInline(d.text).trim();
      parts.push(`${"  ".repeat(ctx.listDepth || 0)}- ${txt}`);
      for (const c of d.children || []) {
        renderBlock(c, { ...ctx, listDepth: (ctx.listDepth || 0) + 1 });
      }
      return;
    }
    if (t === "ordered") {
      const seq = Number(d.seq) > 0 ? Number(d.seq) : 1;
      const txt = renderInline(d.text).trim();
      parts.push(`${"  ".repeat(ctx.listDepth || 0)}${seq}. ${txt}`);
      for (const c of d.children || []) {
        renderBlock(c, { ...ctx, listDepth: (ctx.listDepth || 0) + 1 });
      }
      return;
    }
    if (t === "quote_container") {
      const children = d.children || [];
      if (!children.length) return;
      for (const c of children) {
        renderBlock(c, { ...ctx, quote: true });
      }
      return;
    }
    if (t === "image") {
      const rel = imagePathMap.get(id);
      const caption = renderInline(d.image?.caption?.text).trim();
      const alt = caption || d.image?.name || "image";
      if (rel) {
        parts.push(`![${escapeMarkdownText(alt)}](${rel})`);
      } else {
        parts.push(`![${escapeMarkdownText(alt)}](#image-missing-${id})`);
      }
      if (caption) {
        parts.push(`*${escapeMarkdownText(caption)}*`);
      }
      return;
    }
    if (t === "table") {
      const tableMd = buildTableMarkdown(blk, blockMap);
      if (tableMd) parts.push(tableMd);
      return;
    }
    if (t === "sheet") {
      const token = d.token || "";
      const sheetUrl = `https://my.feishu.cn/sheets/${token}`;
      const preview = sheetPreviewMap.get(id);
      if (preview?.imagePath) {
        parts.push(`![嵌入电子表格预览](${preview.imagePath})`);
      }
      parts.push(`[嵌入电子表格（飞书 Sheet）](${sheetUrl})`);
      return;
    }
    if (t === "table_cell") {
      return;
    }
    if (t === "page") {
      for (const c of d.children || []) renderBlock(c, ctx);
      return;
    }

    const fallbackText = renderInline(d.text).trim();
    if (fallbackText) parts.push(fallbackText);
  }

  for (const child of root?.data?.children || []) {
    renderBlock(child, {});
  }

  const compact = [];
  let prevBlank = false;
  for (const p of parts) {
    const normalized = (p || "").replace(/\u200b/g, "").trimEnd();
    const blank = normalized.length === 0;
    if (blank && prevBlank) continue;
    compact.push(normalized);
    prevBlank = blank;
  }

  return compact.join("\n\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

async function main() {
  const docUrl = process.argv[2];
  const outRoot = process.argv[3] || path.join(process.cwd(), "output");
  if (!docUrl) {
    usage();
    process.exit(1);
  }

  const docId = parseDocToken(docUrl);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(docUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForTimeout(5000);

    const { blockMap, rootId, structureVersion } = await loadDocData(page, docId);
    const title = renderInline(blockMap.get(rootId)?.data?.text, { plain: true }).trim() || docId;
    const safeTitle = sanitizeName(title);

    const outputDir = path.join(outRoot, `${safeTitle}-${docId}`);
    const assetsDirName = "images";
    const assetsDirAbs = path.join(outputDir, assetsDirName);
    const mdPath = path.join(outputDir, "document.md");

    await fs.mkdir(outputDir, { recursive: true });

    const imageBlocks = collectImagesInOrder(rootId, blockMap);
    const imagePathMap = await downloadAndDecryptImages(
      page,
      imageBlocks,
      assetsDirAbs,
      assetsDirName
    );

    const sheetBlocks = collectSheetBlocksInOrder(rootId, blockMap);
    const sheetPreviewMap = await captureSheetPreviews(
      page,
      sheetBlocks,
      assetsDirAbs,
      assetsDirName
    );

    const md = buildMarkdown(rootId, blockMap, imagePathMap, sheetPreviewMap);
    await fs.writeFile(mdPath, md, "utf8");

    const meta = {
      source: docUrl,
      docId,
      structureVersion,
      blockCount: blockMap.size,
      imageCountInDoc: imageBlocks.length,
      imageCountDownloaded: imagePathMap.size,
      sheetCountInDoc: sheetBlocks.length,
      sheetPreviewCount: Array.from(sheetPreviewMap.values()).filter((x) => x.imagePath).length,
      generatedAt: new Date().toISOString(),
    };
    await fs.writeFile(path.join(outputDir, "meta.json"), JSON.stringify(meta, null, 2), "utf8");

    console.log(JSON.stringify({ ok: true, outputDir, mdPath, meta }, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
