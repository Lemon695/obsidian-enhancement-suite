/**
 * Paste Link 模块的纯函数。
 *
 * 方案 A（保守）：仅当「有选中文字」且「剪贴板是一个 URL」时，
 * 才把选中文字转为 Markdown 链接 `[选中文字](url)`。
 * 其余情况一律返回 null，表示「不拦截，放行 Obsidian 默认粘贴行为」。
 *
 * 纯函数：是（无副作用，不依赖 Obsidian / DOM）。
 */

/**
 * 判断一段文本是否是「单个 URL」。
 *
 * 规则（保守）：
 *   - 去除首尾空白后，必须以 http:// 或 https:// 开头
 *   - 整体不含空白字符（即只有一个 token，避免把"句子里带链接"误判为 URL）
 */
export function isSingleUrl(text: string): boolean {
	const trimmed = text.trim();
	if (trimmed.length === 0) return false;
	if (/\s/.test(trimmed)) return false;
	return /^https?:\/\/\S+$/.test(trimmed);
}

/**
 * 根据当前选中文字与剪贴板内容，构造 Markdown 链接。
 *
 * @param selectedText 编辑器当前选中的文字（可能为空字符串）
 * @param clipboardText 剪贴板的纯文本内容
 * @returns `[选中文字](url)`；若不满足拦截条件则返回 null（放行默认粘贴）
 *
 * 方案 A 拦截条件（两者同时满足）：
 *   1. selectedText 去空白后非空（避免对空选区/纯空白选区生成空链接文本）
 *   2. clipboardText 是单个 URL（isSingleUrl）
 */
export function buildMarkdownLink(
	selectedText: string,
	clipboardText: string
): string | null {
	if (selectedText.trim().length === 0) return null;
	if (!isSingleUrl(clipboardText)) return null;
	return `[${selectedText}](${clipboardText.trim()})`;
}
