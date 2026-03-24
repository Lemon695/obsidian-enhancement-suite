/**
 * Base module — 纯函数层
 *
 * 无 Obsidian 运行时依赖（parseYaml/stringifyYaml 通过 mock 在测试中提供），
 * 所有函数均可在 vitest 单元测试中直接调用。
 */
import { parseYaml, stringifyYaml } from 'obsidian';

// ---------------------------------------------------------------------------
// 解析
// ---------------------------------------------------------------------------

export type ParseResult =
	| { ok: true; value: unknown }
	| { ok: false; error: string };

/**
 * 将 .base 文件内容（YAML 字符串）解析为 JavaScript 值。
 * 失败时返回 { ok: false, error } 而非抛出异常。
 */
export function parseBase(content: string): ParseResult {
	if (!content.trim()) {
		return { ok: false, error: 'Empty content' };
	}
	try {
		const value = parseYaml(content);
		return { ok: true, value };
	} catch (e) {
		return { ok: false, error: e instanceof Error ? e.message : String(e) };
	}
}

// ---------------------------------------------------------------------------
// 格式化
// ---------------------------------------------------------------------------

/**
 * 将 JavaScript 值序列化为 YAML 字符串。
 */
export function formatBase(value: unknown): string {
	return stringifyYaml(value);
}

// ---------------------------------------------------------------------------
// 校验
// ---------------------------------------------------------------------------

export interface BaseValidationResult {
	valid: boolean;
	/** 错误消息；有效时为 undefined。 */
	error?: string;
}

/**
 * 校验 .base 文件内容：
 *   1. 可解析为 YAML
 *   2. 顶层为对象（非 null）
 *   3. 包含 views 键
 *   4. views 的值为数组
 */
export function validateBase(content: string): BaseValidationResult {
	if (!content.trim()) {
		return { valid: false, error: 'Empty content' };
	}

	let parsed: unknown;
	try {
		parsed = parseYaml(content);
	} catch (e) {
		return {
			valid: false,
			error: e instanceof Error ? e.message : String(e),
		};
	}

	if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
		return { valid: false, error: 'Top-level value must be an object' };
	}

	const obj = parsed as Record<string, unknown>;
	if (!('views' in obj)) {
		return { valid: false, error: 'Missing required key: views' };
	}

	if (!Array.isArray(obj['views'])) {
		return { valid: false, error: 'views must be an array' };
	}

	return { valid: true };
}

// ---------------------------------------------------------------------------
// 统计
// ---------------------------------------------------------------------------

export interface BaseStats {
	/** views 数组的元素数量 */
	viewCount: number;
	/** 解析值的最大嵌套深度 */
	depth: number;
	/** 原始字符串的字节长度 */
	size: number;
}

/**
 * 计算 .base 文件的统计信息。
 *
 * @param value       已解析的 JavaScript 值
 * @param rawContent  原始 YAML 字符串（用于计算 size）
 */
export function getBaseStats(value: unknown, rawContent: string): BaseStats {
	let viewCount = 0;
	if (
		value !== null &&
		typeof value === 'object' &&
		!Array.isArray(value)
	) {
		const obj = value as Record<string, unknown>;
		if (Array.isArray(obj['views'])) {
			viewCount = (obj['views'] as unknown[]).length;
		}
	}

	return {
		viewCount,
		depth: getDepth(value),
		size: rawContent.length,
	};
}

function getDepth(value: unknown): number {
	if (value === null || typeof value !== 'object') return 0;
	if (Array.isArray(value)) {
		const arr = value as unknown[];
		if (arr.length === 0) return 1;
		return 1 + Math.max(...arr.map(getDepth));
	}
	const entries = Object.values(value as Record<string, unknown>);
	if (entries.length === 0) return 1;
	return 1 + Math.max(...entries.map(getDepth));
}
