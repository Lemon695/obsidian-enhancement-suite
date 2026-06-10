import type { PluginSettings } from './types';

/**
 * 将持久化的设置（loadData 读出的旧数据）深合并到默认值之上。
 *
 * 为什么需要它：
 *   Obsidian 的 `loadData()` 返回的是「上一次（可能是旧版本）保存的内容」。
 *   若用 `Object.assign({}, DEFAULT_SETTINGS, loaded)` 这种浅合并，
 *   一旦某个模块切片存在，整块会被旧数据替换掉——新版本给该切片新增的字段
 *   （例如 progress.barColor）就会丢失，运行时读到 undefined，进而出现
 *   `style.backgroundColor = "undefined"` 之类的问题。
 *
 * 合并语义（逐模块切片一层合并）：
 *   1. 用户已保存的值优先；
 *   2. 新版本新增、旧数据缺失的默认字段补齐；
 *   3. defaults 中已不存在的顶层键（已删除模块的残留）被丢弃。
 *
 * PluginSettings 的形状恰好是两层（顶层键 → 扁平的基本类型切片），
 * 因此「两层合并」即完整且正确，无需任意深度递归。
 *
 * 纯函数：是（不修改任何入参，返回全新对象，嵌套切片均为新对象引用）。
 */
export function mergeSettings(
	defaults: PluginSettings,
	loaded: Partial<PluginSettings> | null | undefined
): PluginSettings {
	const loadedRecord: Record<string, unknown> =
		loaded && typeof loaded === 'object' ? (loaded as Record<string, unknown>) : {};
	const defaultsRecord = defaults as unknown as Record<string, unknown>;
	const result: Record<string, unknown> = {};

	for (const key of Object.keys(defaultsRecord)) {
		const defaultValue = defaultsRecord[key];
		const loadedValue = loadedRecord[key];

		if (isPlainObject(defaultValue)) {
			// 一层合并：用户已存的键覆盖默认，缺失的默认键得到保留。
			result[key] = {
				...defaultValue,
				...(isPlainObject(loadedValue) ? loadedValue : {}),
			};
		} else {
			// 基本类型：仅当 loaded 显式提供该键时才采用，否则用默认值。
			result[key] = key in loadedRecord ? loadedValue : defaultValue;
		}
	}

	return result as unknown as PluginSettings;
}

/** 判断是否为可合并的普通对象（排除 null 与数组）。 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
