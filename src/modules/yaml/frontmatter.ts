/**
 * YAML Frontmatter 解析与验证工具函数。
 *
 * 本文件不依赖任何 Obsidian API，所有函数均可在单元测试中直接调用。
 * 验证器为轻量级结构检查器，不替代完整 YAML 解析库。
 */

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

/** 已识别的 frontmatter 区域信息。 */
export interface FrontmatterRegion {
	/** 两个 `---` 分隔线之间的原始 YAML 文本（不含分隔线本身）。 */
	content: string;
	/** 文档中开始分隔线所在的行号（0 为基础）。 */
	startLine: number;
	/** 文档中结束分隔线所在的行号（0 为基础）。 */
	endLine: number;
}

/** 单条验证错误。 */
export interface FrontmatterError {
	/** 在 frontmatter 内部的行号（0 为基础）。 */
	line: number;
	/** 错误描述。 */
	message: string;
}

/** 已解析的键值对（仅顶层）。 */
export interface FrontmatterField {
	key: string;
	rawValue: string;
}

// ---------------------------------------------------------------------------
// 解析
// ---------------------------------------------------------------------------

/**
 * 从文档内容中提取 frontmatter 区域。
 *
 * Obsidian 的 frontmatter 规范：
 *   - 文档必须以 `---` 开头（第 0 行，可有尾随空格）
 *   - 以第二个 `---` 行作为结束
 *   - 两个分隔线之间为 YAML 内容
 *
 * 未找到有效 frontmatter 时返回 null。
 */
export function extractFrontmatter(content: string): FrontmatterRegion | null {
	const lines = content.split('\n');

	// 第一行必须是 ---
	if ((lines[0] ?? '').trimEnd() !== '---') return null;

	// 寻找结束分隔线（从第 1 行开始）
	const closingIndex = lines.findIndex(
		(line, i) => i > 0 && line.trimEnd() === '---'
	);
	if (closingIndex === -1) return null;

	return {
		content: lines.slice(1, closingIndex).join('\n'),
		startLine: 0,
		endLine: closingIndex,
	};
}

/**
 * 解析 frontmatter YAML 文本，返回顶层字段列表。
 * 仅处理简单的 `key: value` 格式，嵌套结构以原始文本保留。
 */
export function parseFrontmatterFields(
	yamlContent: string
): FrontmatterField[] {
	const fields: FrontmatterField[] = [];
	const lines = yamlContent.split('\n');

	for (const line of lines) {
		const trimmed = line.trim();
		// 跳过空行、注释行、缩进行（值的延续）和列表项
		if (!trimmed || trimmed.startsWith('#')) continue;
		if (line.startsWith(' ') || line.startsWith('\t')) continue;
		if (trimmed.startsWith('-')) continue;

		const colonIndex = trimmed.indexOf(':');
		if (colonIndex === -1) continue;

		fields.push({
			key: trimmed.slice(0, colonIndex).trim(),
			rawValue: trimmed.slice(colonIndex + 1).trim(),
		});
	}

	return fields;
}

// ---------------------------------------------------------------------------
// 验证
// ---------------------------------------------------------------------------

/**
 * 对 frontmatter 的 YAML 内容进行结构验证。
 *
 * 检查项：
 *   - 顶层行缺少冒号（非缩进行、非注释行、非列表项）
 *   - 重复的顶层键
 *
 * 返回错误列表，空数组表示无错误。
 * 行号相对于 frontmatter 内部（0 为基础）。
 */
export function validateFrontmatterYaml(
	yamlContent: string
): FrontmatterError[] {
	const errors: FrontmatterError[] = [];
	const lines = yamlContent.split('\n');
	const seenKeys = new Set<string>();

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? '';
		const trimmed = line.trim();

		// 跳过空行与注释
		if (!trimmed || trimmed.startsWith('#')) continue;
		// 跳过缩进行（多行值的延续）
		if (line.startsWith(' ') || line.startsWith('\t')) continue;
		// 跳过列表项
		if (trimmed.startsWith('-')) continue;

		const colonIndex = trimmed.indexOf(':');
		if (colonIndex === -1) {
			errors.push({
				line: i,
				message: `Line ${i + 1}: expected "key: value" format, got "${trimmed}"`,
			});
			continue;
		}

		const key = trimmed.slice(0, colonIndex).trim();

		// 检查是否包含非法字符（键不应含引号外的特殊字符）
		if (/[{}[\]|>*&!%@`]/.test(key)) {
			errors.push({
				line: i,
				message: `Line ${i + 1}: key "${key}" contains invalid characters`,
			});
			continue;
		}

		if (seenKeys.has(key)) {
			errors.push({
				line: i,
				message: `Line ${i + 1}: duplicate key "${key}"`,
			});
		} else {
			seenKeys.add(key);
		}
	}

	return errors;
}

/**
 * 快速判断文档是否以 frontmatter 开头（仅检查首行）。
 */
export function hasFrontmatter(content: string): boolean {
	return content.startsWith('---\n') || content.startsWith('---\r\n');
}
