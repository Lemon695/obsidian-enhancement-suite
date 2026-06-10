/**
 * Footnotes 模块的纯字符串转换函数。
 *
 * 从 index.ts 抽离，使核心算法可单元测试、不依赖 Obsidian Editor。
 * index.ts 仅负责读取/写回 editor 并保留光标。
 *
 * 全部为纯函数：不修改入参，返回新字符串。
 */

/** 脚注引用 / 定义的通用扫描正则：捕获标签 + 是否为定义（紧跟冒号）。 */
const FOOTNOTE_TOKEN = /\[\^([^\]]+)\](:?)/g;

/** 正则元字符转义，供动态构造 RegExp 时使用。 */
function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 选取当前文档中最小的未使用数字脚注编号（从 1 起）。
 * 只考虑纯数字标签（`[^12]`），忽略命名标签（`[^note]`）。
 */
export function pickNextFootnoteNumber(content: string): number {
	const used = new Set<number>();
	for (const m of content.matchAll(/\[\^(\d+)\]/g)) {
		used.add(parseInt(m[1] ?? '0', 10));
	}
	let n = 1;
	while (used.has(n)) n++;
	return n;
}

/**
 * 按引用首次出现顺序，将所有脚注重编为 1, 2, 3, ...
 *
 * 算法：
 *   1. 扫描所有 `[^label]`（跳过定义行），收集有序唯一标签
 *   2. 建立 oldLabel → newNum 映射
 *   3. 两阶段替换（先唯一占位符，再最终编号），避免 "1→2, 2→1" 互相覆盖
 *
 * @returns 新内容 + 重编的脚注数量（count 为 0 表示无脚注，内容原样返回）
 */
export function renumberFootnotes(content: string): { content: string; count: number } {
	const labelOrder: string[] = [];
	const seen = new Set<string>();
	for (const m of content.matchAll(FOOTNOTE_TOKEN)) {
		const label = m[1] ?? '';
		const isDefinition = m[2] === ':';
		if (!isDefinition && !seen.has(label)) {
			seen.add(label);
			labelOrder.push(label);
		}
	}

	if (labelOrder.length === 0) {
		return { content, count: 0 };
	}

	const renameMap = new Map<string, string>(
		labelOrder.map((label, idx) => [label, String(idx + 1)])
	);

	// 阶段 1：替换为唯一占位符（按标签长度降序，防短标签误匹配长标签前缀）
	const sortedLabels = [...renameMap.keys()].sort((a, b) => b.length - a.length);
	const placeholders = new Map<string, string>();
	sortedLabels.forEach((label, i) => placeholders.set(label, `__FNPH${i}__`));

	let result = content;
	for (const label of sortedLabels) {
		const ph = placeholders.get(label) ?? '';
		result = result.replace(
			new RegExp(`\\[\\^${escapeRegExp(label)}\\]`, 'g'),
			`[^${ph}]`
		);
	}

	// 阶段 2：占位符 → 最终编号
	for (const [label, ph] of placeholders.entries()) {
		const newNum = renameMap.get(label) ?? label;
		result = result.replace(
			new RegExp(`\\[\\^${escapeRegExp(ph)}\\]`, 'g'),
			`[^${newNum}]`
		);
	}

	return { content: result, count: labelOrder.length };
}

/**
 * 删除没有对应引用的脚注定义行（`[^label]: ...`）。
 *
 * 判定：
 *   - 定义行：行首匹配 `[^label]:`
 *   - 被引用：文档其他位置出现 `[^label]`（非定义行）
 *
 * @returns 新内容 + 删除的孤立定义数量（removed 为 0 时内容原样返回）
 */
export function removeOrphanFootnoteDefs(content: string): { content: string; removed: number } {
	const usedLabels = new Set<string>();
	for (const m of content.matchAll(FOOTNOTE_TOKEN)) {
		const label = m[1] ?? '';
		if (m[2] !== ':') usedLabels.add(label);
	}

	const lines = content.split('\n');
	const cleaned: string[] = [];
	let removed = 0;

	for (const line of lines) {
		const defMatch = line.match(/^\[\^([^\]]+)\]:/);
		if (defMatch) {
			const label = defMatch[1] ?? '';
			if (!usedLabels.has(label)) {
				removed++;
				continue;
			}
		}
		cleaned.push(line);
	}

	return removed > 0 ? { content: cleaned.join('\n'), removed } : { content, removed: 0 };
}
