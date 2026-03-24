/**
 * 搜索与替换的工具库。
 *
 * searchInContent / applyReplacement — 纯函数，无 Obsidian 依赖，可单元测试。
 * searchInFiles / searchAndReplaceInFile — 依赖 Obsidian App，用于跨文件操作。
 */

import { App, TFile } from 'obsidian';

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

export interface SearchMatch {
	/** 在完整文档字符串中的起始偏移量（绝对值）。 */
	from: number;
	/** 结束偏移量（不含该位置字符）。 */
	to: number;
	/** 0 为基础的行号。 */
	line: number;
	/** 匹配内容在该行中的起始列号（ch）。 */
	ch: number;
	/** 匹配内容在该行中的结束列号（chEnd）。 */
	chEnd: number;
	/** 该行的完整文本（用于结果预览）。 */
	lineText: string;
	/** 匹配到的文本内容。 */
	matchText: string;
}

export interface SearchOptions {
	caseSensitive: boolean;
	useRegex: boolean;
}

/** 跨文件搜索的单文件结果。 */
export interface MultiFileMatch {
	file: TFile;
	matches: SearchMatch[];
}

// ---------------------------------------------------------------------------
// 搜索（纯函数）
// ---------------------------------------------------------------------------

/**
 * 在 `content` 中搜索 `term`，返回所有匹配结果。
 *
 * - term 为空时返回空数组。
 * - 正则表达式非法时返回空数组（不抛出异常）。
 * - 不支持跨行匹配（regex 不加 `s` 标志），每次匹配都在单行内完成。
 */
export function searchInContent(
	content: string,
	term: string,
	options: SearchOptions
): SearchMatch[] {
	if (!term) return [];

	let regex: RegExp;
	try {
		const flags = options.caseSensitive ? 'g' : 'gi';
		const pattern = options.useRegex ? term : escapeRegex(term);
		regex = new RegExp(pattern, flags);
	} catch {
		// 无效正则：静默返回空结果
		return [];
	}

	const matches: SearchMatch[] = [];
	const lines = content.split('\n');
	let offset = 0;

	for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
		const line = lines[lineIndex] ?? '';
		regex.lastIndex = 0;

		let m: RegExpExecArray | null;
		while ((m = regex.exec(line)) !== null) {
			const matchText = m[0] ?? '';
			matches.push({
				from: offset + m.index,
				to: offset + m.index + matchText.length,
				line: lineIndex,
				ch: m.index,
				chEnd: m.index + matchText.length,
				lineText: line,
				matchText,
			});
			// 防止零宽匹配（如 /a*/）造成死循环
			if (matchText.length === 0) regex.lastIndex++;
		}

		offset += line.length + 1; // +1 对应换行符
	}

	return matches;
}

// ---------------------------------------------------------------------------
// 替换（纯函数）
// ---------------------------------------------------------------------------

/**
 * 将 `matches` 中的所有匹配项替换为 `replacement`。
 *
 * 从后向前处理，以保证前面匹配项的偏移量不因替换而失效。
 * 返回替换后的完整文档字符串。
 */
export function applyReplacement(
	content: string,
	matches: SearchMatch[],
	replacement: string
): string {
	let result = content;
	for (let i = matches.length - 1; i >= 0; i--) {
		const match = matches[i];
		if (!match) continue;
		result = result.slice(0, match.from) + replacement + result.slice(match.to);
	}
	return result;
}

// ---------------------------------------------------------------------------
// 跨文件搜索（需要 Obsidian App）
// ---------------------------------------------------------------------------

/**
 * 在多个文件中搜索 `term`，返回有匹配的文件列表（每项含匹配详情）。
 *
 * 对每个文件调用 `vault.read()` 再用 `searchInContent()` 处理。
 * 无匹配的文件不出现在结果中。
 */
export async function searchInFiles(
	app: App,
	files: TFile[],
	term: string,
	options: SearchOptions
): Promise<MultiFileMatch[]> {
	if (!term) return [];

	const results: MultiFileMatch[] = [];

	for (const file of files) {
		try {
			const content = await app.vault.read(file);
			const matches = searchInContent(content, term, options);
			if (matches.length > 0) {
				results.push({ file, matches });
			}
		} catch {
			// 读取失败：跳过该文件
		}
	}

	return results;
}

/**
 * 在单个文件中执行原子化搜索替换（read → match → replace → write）。
 *
 * 不使用预先计算的 match 偏移量，而是实时重算，避免偏移漂移问题。
 * 返回实际替换次数；若无匹配则返回 0，文件不被修改。
 */
export async function searchAndReplaceInFile(
	app: App,
	file: TFile,
	term: string,
	replacement: string,
	options: SearchOptions
): Promise<number> {
	const content = await app.vault.read(file);
	const matches = searchInContent(content, term, options);
	if (matches.length === 0) return 0;

	const newContent = applyReplacement(content, matches, replacement);
	await app.vault.modify(file, newContent);
	return matches.length;
}

// ---------------------------------------------------------------------------
// 私有辅助
// ---------------------------------------------------------------------------

/** 将字符串中的所有正则特殊字符进行转义。 */
function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
