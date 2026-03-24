/**
 * JSON module — 纯函数层
 *
 * 无 Obsidian 依赖，所有函数均可在 vitest 单元测试中直接调用。
 */

// ---------------------------------------------------------------------------
// 解析
// ---------------------------------------------------------------------------

export type ParseResult =
	| { ok: true; value: unknown }
	| { ok: false; error: string };

/**
 * 将 JSON 字符串解析为 JavaScript 值。
 * 失败时返回 { ok: false, error } 而非抛出异常。
 */
export function parseJson(content: string): ParseResult {
	try {
		return { ok: true, value: JSON.parse(content) };
	} catch (e) {
		return { ok: false, error: e instanceof Error ? e.message : String(e) };
	}
}

// ---------------------------------------------------------------------------
// 格式化
// ---------------------------------------------------------------------------

/**
 * 将 JavaScript 值序列化为格式化的 JSON 字符串。
 *
 * @param value   要序列化的值
 * @param indent  缩进空格数，默认 2
 */
export function formatJson(value: unknown, indent = 2): string {
	return JSON.stringify(value, null, indent);
}

// ---------------------------------------------------------------------------
// 校验
// ---------------------------------------------------------------------------

export interface JsonValidationResult {
	valid: boolean;
	/** SyntaxError 的错误消息；有效时为 undefined。 */
	error?: string;
	/** 错误所在行（1-indexed）；无法解析时为 undefined。 */
	line?: number;
}

/**
 * 校验 JSON 字符串。
 * 尝试从 SyntaxError 消息中提取行号（不同 JS 引擎格式不同，尽力而为）。
 */
export function validateJson(content: string): JsonValidationResult {
	try {
		JSON.parse(content);
		return { valid: true };
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);

		// 尝试从 "at position N" 换算行号
		let line: number | undefined;
		const posMatch = msg.match(/position\s+(\d+)/i);
		const posStr = posMatch?.[1];
		if (posStr !== undefined) {
			const pos = parseInt(posStr, 10);
			line = content.slice(0, pos).split('\n').length;
		}
		// 某些引擎直接给出 "line N column M"
		const lineMatch = msg.match(/\bline\s+(\d+)/i);
		const lineStr = lineMatch?.[1];
		if (lineStr !== undefined) {
			line = parseInt(lineStr, 10);
		}

		return { valid: false, error: msg, line };
	}
}

// ---------------------------------------------------------------------------
// 统计
// ---------------------------------------------------------------------------

export interface JsonStats {
	/** 所有对象层级中键的总数（数组元素不计）。 */
	keys: number;
	/** 最大嵌套深度（原始值深度为 0，空对象/数组为 1）。 */
	depth: number;
	/** JSON.stringify 后的字节长度（UTF-16 字符数）。 */
	size: number;
}

/** 计算 JSON 值的统计信息。 */
export function getJsonStats(value: unknown): JsonStats {
	return {
		keys: countKeys(value),
		depth: getDepth(value),
		size: JSON.stringify(value).length,
	};
}

function countKeys(value: unknown): number {
	if (value === null || typeof value !== 'object') return 0;
	if (Array.isArray(value)) {
		return (value as unknown[]).reduce<number>(
			(sum, item) => sum + countKeys(item),
			0,
		);
	}
	const obj = value as Record<string, unknown>;
	const own = Object.keys(obj).length;
	return (
		own +
		Object.values(obj).reduce<number>((sum, v) => sum + countKeys(v), 0)
	);
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
