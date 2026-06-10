import { describe, it, expect } from 'vitest';
import { mergeSettings } from './settings-merge';
import { DEFAULT_SETTINGS, PluginSettings } from './types';

// ---------------------------------------------------------------------------
// mergeSettings — 设置深合并（修复浅合并丢默认值问题）
// ---------------------------------------------------------------------------

describe('mergeSettings — 空/无效输入', () => {
	it('loaded 为 undefined 时返回默认值（值相等）', () => {
		expect(mergeSettings(DEFAULT_SETTINGS, undefined)).toEqual(DEFAULT_SETTINGS);
	});

	it('loaded 为 null 时返回默认值（值相等）', () => {
		expect(mergeSettings(DEFAULT_SETTINGS, null)).toEqual(DEFAULT_SETTINGS);
	});

	it('不修改传入的 DEFAULT_SETTINGS（不变性）', () => {
		const snapshot = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as PluginSettings;
		mergeSettings(DEFAULT_SETTINGS, { progress: { barHeightPx: 99 } } as Partial<PluginSettings>);
		expect(DEFAULT_SETTINGS).toEqual(snapshot);
	});

	it('返回的嵌套切片不是默认对象的同一引用', () => {
		const result = mergeSettings(DEFAULT_SETTINGS, undefined);
		expect(result.progress).not.toBe(DEFAULT_SETTINGS.progress);
		expect(result.moduleEnabled).not.toBe(DEFAULT_SETTINGS.moduleEnabled);
	});
});

describe('mergeSettings — 模块切片补齐新字段', () => {
	it('旧 data 缺少新版新增字段时，补回默认值', () => {
		// 模拟旧版只存了 barHeightPx，没有 barColor
		const loaded = { progress: { barHeightPx: 5 } } as Partial<PluginSettings>;
		const result = mergeSettings(DEFAULT_SETTINGS, loaded);
		expect(result.progress.barHeightPx).toBe(5); // 用户值保留
		expect(result.progress.barColor).toBe(DEFAULT_SETTINGS.progress.barColor); // 默认补齐
	});

	it('用户已存的值优先于默认值', () => {
		const loaded = {
			stats: { chineseReadingSpeed: 500, englishReadingSpeed: 250 },
		} as Partial<PluginSettings>;
		const result = mergeSettings(DEFAULT_SETTINGS, loaded);
		expect(result.stats.chineseReadingSpeed).toBe(500);
		expect(result.stats.englishReadingSpeed).toBe(250);
	});

	it('未出现在 loaded 中的模块切片整体使用默认值', () => {
		const loaded = { progress: { barHeightPx: 7 } } as Partial<PluginSettings>;
		const result = mergeSettings(DEFAULT_SETTINGS, loaded);
		expect(result.replace).toEqual(DEFAULT_SETTINGS.replace);
		expect(result.json).toEqual(DEFAULT_SETTINGS.json);
	});
});

describe('mergeSettings — moduleEnabled 合并', () => {
	it('用户显式关闭的模块保留 false', () => {
		const loaded = { moduleEnabled: { stats: false } } as Partial<PluginSettings>;
		const result = mergeSettings(DEFAULT_SETTINGS, loaded);
		expect(result.moduleEnabled.stats).toBe(false);
	});

	it('旧 data 未知的新模块获得默认 true', () => {
		// 旧 data.json 不含 terminal 键
		const loaded = { moduleEnabled: { stats: true } } as Partial<PluginSettings>;
		const result = mergeSettings(DEFAULT_SETTINGS, loaded);
		expect(result.moduleEnabled.terminal).toBe(true);
	});
});

describe('mergeSettings — 清理残留键', () => {
	it('丢弃 defaults 中不存在的顶层键（已删模块残留）', () => {
		const loaded = { obsoleteModule: { foo: 1 } } as unknown as Partial<PluginSettings>;
		const result = mergeSettings(DEFAULT_SETTINGS, loaded) as unknown as Record<string, unknown>;
		expect('obsoleteModule' in result).toBe(false);
	});
});
