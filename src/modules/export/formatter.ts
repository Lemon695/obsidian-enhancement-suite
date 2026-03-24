/**
 * 导出格式化工具函数。
 *
 * 职责：
 *   - cleanMarkdownForExport  — 清理 Obsidian 专有语法，生成标准 Markdown
 *   - markdownToHtml          — 将 Markdown 转换为独立 HTML 文档
 *   - embedImages             — 将 HTML 内 vault 图片替换为 Base64 data URI（需 Obsidian App）
 *   - escapeHtml              — HTML 特殊字符转义
 */

import { App, TFile } from 'obsidian';

// ---------------------------------------------------------------------------
// Markdown 清理
// ---------------------------------------------------------------------------

/**
 * 将 Obsidian Markdown 清理为标准 Markdown，用于导出。
 *
 * 处理内容：
 *   - 移除嵌入引用 `![[filename]]`
 *   - 转换带别名 wiki 链接 `[[target|alias]]` → `[alias](target)`
 *   - 转换普通 wiki 链接 `[[target]]` → `target`
 *   - 移除高亮标记 `==text==` → `text`
 *   - 移除 YAML frontmatter 块（两个 `---` 之间的内容）
 */
export function cleanMarkdownForExport(content: string): string {
	let result = content;

	// 移除 YAML frontmatter
	result = result.replace(/^---\n[\s\S]*?\n---\n?/, '');

	// 移除嵌入引用
	result = result.replace(/!\[\[([^\]]+)\]\]/g, '');

	// [[target|alias]] → [alias](target)
	result = result.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '[$2]($1)');

	// [[target]] → target（无链接，纯文本）
	result = result.replace(/\[\[([^\]]+)\]\]/g, '$1');

	// ==高亮== → 高亮
	result = result.replace(/==([^=]+)==/g, '$1');

	return result.trim();
}

// ---------------------------------------------------------------------------
// Markdown → HTML 转换
// ---------------------------------------------------------------------------

/**
 * 将 Markdown 文本转换为独立的 HTML 文档字符串。
 *
 * 支持的 Markdown 元素：
 *   - 标题（h1–h6）
 *   - 粗体、斜体、粗斜体
 *   - 内联代码
 *   - 标准链接 `[text](url)`
 *   - 图片 `![alt](url)`
 *   - 无序列表（`-` 或 `*`）
 *   - 水平分隔线 `---`
 *   - 段落（空行分隔）
 *
 * 注意：这是一个轻量级转换器，适合基础文档。
 * 复杂场景（表格、嵌套列表、代码块）建议集成专业 Markdown 库。
 */
export function markdownToHtml(title: string, markdown: string): string {
	let body = markdown;

	// 标题（必须在段落处理之前）
	body = body
		.replace(/^###### (.+)$/gm, '<h6>$1</h6>')
		.replace(/^##### (.+)$/gm, '<h5>$1</h5>')
		.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
		.replace(/^### (.+)$/gm, '<h3>$1</h3>')
		.replace(/^## (.+)$/gm, '<h2>$1</h2>')
		.replace(/^# (.+)$/gm, '<h1>$1</h1>');

	// 水平分隔线
	body = body.replace(/^---$/gm, '<hr>');

	// 无序列表项
	body = body.replace(/^[*-] (.+)$/gm, '<li>$1</li>');
	// 将连续 <li> 包裹进 <ul>
	body = body.replace(/(<li>[\s\S]*?<\/li>)(\n(?!<li>)|$)/g, '<ul>$1</ul>$2');

	// 图片（必须在链接之前处理）
	body = body.replace(
		/!\[([^\]]*)\]\(([^)]+)\)/g,
		'<img src="$2" alt="$1" style="max-width:100%">'
	);

	// 链接
	body = body.replace(
		/\[([^\]]+)\]\(([^)]+)\)/g,
		'<a href="$2">$1</a>'
	);

	// 粗斜体、粗体、斜体（顺序重要）
	body = body
		.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.+?)\*/g, '<em>$1</em>')
		.replace(/__(.+?)__/g, '<strong>$1</strong>')
		.replace(/_(.+?)_/g, '<em>$1</em>');

	// 内联代码（必须在其他行内处理之后）
	body = body.replace(/`([^`]+)`/g, '<code>$1</code>');

	// 段落（两个以上换行 → 段落分割）
	body = body
		.split(/\n\n+/)
		.map((block) => {
			const trimmed = block.trim();
			// 已经是块级元素则不包裹 <p>
			if (/^<(h[1-6]|ul|ol|li|hr|img|blockquote)/.test(trimmed)) {
				return trimmed;
			}
			return trimmed ? `<p>${trimmed.replace(/\n/g, '<br>')}</p>` : '';
		})
		.filter(Boolean)
		.join('\n');

	return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1.5rem;
      line-height: 1.7;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 {
      border-bottom: 1px solid #eee;
      padding-bottom: 0.25rem;
      margin-top: 1.5rem;
    }
    code {
      background: #f4f4f4;
      padding: 0.1em 0.35em;
      border-radius: 3px;
      font-size: 0.88em;
      font-family: 'SFMono-Regular', Consolas, monospace;
    }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    a { color: #0070f3; text-decoration: none; }
    a:hover { text-decoration: underline; }
    hr { border: none; border-top: 1px solid #ddd; margin: 2rem 0; }
    img { max-width: 100%; height: auto; }
    ul, ol { padding-left: 1.5rem; }
    li { margin: 0.25rem 0; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// 图片内嵌（Base64 data URI）
// ---------------------------------------------------------------------------

/**
 * 将 HTML 中 vault 路径的 `<img src="...">` 替换为 Base64 data URI。
 *
 * 跳过 http / https / data: 开头的 src（外部资源或已内嵌的资源）。
 * 读取失败时保留原始 src，不中断整体导出流程。
 *
 * @param html  由 markdownToHtml() 生成的 HTML 字符串
 * @param app   Obsidian App 实例（用于 vault.readBinary()）
 */
export async function embedImages(html: string, app: App): Promise<string> {
	const imgPattern = /<img([^>]*?)src="([^"]+)"([^>]*?)>/g;
	const tasks: Array<{ fullTag: string; src: string }> = [];

	let m: RegExpExecArray | null;
	while ((m = imgPattern.exec(html)) !== null) {
		const src = m[2];
		if (
			src &&
			!src.startsWith('http://') &&
			!src.startsWith('https://') &&
			!src.startsWith('data:')
		) {
			tasks.push({ fullTag: m[0] ?? '', src });
		}
	}

	if (tasks.length === 0) return html;

	let result = html;

	for (const { fullTag, src } of tasks) {
		try {
			const filePath = decodeURIComponent(src);
			const abstractFile = app.vault.getAbstractFileByPath(filePath);
			if (!(abstractFile instanceof TFile)) continue;

			const binary = await app.vault.readBinary(abstractFile);
			const mimeType = guessMimeType(abstractFile.extension);
			const base64 = arrayBufferToBase64(binary);
			const dataUri = `data:${mimeType};base64,${base64}`;

			// 仅替换 src 属性值，保留其余 img 属性
			const newTag = fullTag.replace(`src="${src}"`, `src="${dataUri}"`);
			result = result.replace(fullTag, newTag);
		} catch {
			// 读取失败：保留原始 src，继续处理其余图片
		}
	}

	return result;
}

// ---------------------------------------------------------------------------
// 辅助函数
// ---------------------------------------------------------------------------

/** 转义 HTML 特殊字符，防止 XSS 或文档结构损坏。 */
export function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/** 根据文件扩展名推断 MIME 类型。 */
function guessMimeType(ext: string): string {
	switch (ext.toLowerCase()) {
		case 'jpg':
		case 'jpeg':
			return 'image/jpeg';
		case 'gif':
			return 'image/gif';
		case 'webp':
			return 'image/webp';
		case 'svg':
			return 'image/svg+xml';
		case 'bmp':
			return 'image/bmp';
		case 'avif':
			return 'image/avif';
		default:
			return 'image/png';
	}
}

/** 将 ArrayBuffer 转换为 Base64 编码字符串（分块处理，防止栈溢出）。 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	const chunkSize = 8192;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		const chunk = Array.from(bytes.subarray(i, i + chunkSize));
		binary += String.fromCharCode(...chunk);
	}
	return btoa(binary);
}
