import type { I18nDict } from '../../locale';

interface BaseViewerUiI18n {
	treeView: string;
	sourceView: string;
	format: string;
	valid: string;
	invalid: string;
	stats: (viewCount: number, depth: number) => string;
	fileSizeBytes: (bytes: number) => string;
	searchPlaceholder: string;
	replacePlaceholder: string;
	prevMatch: string;
	nextMatch: string;
	replaceOne: string;
	replaceAll: string;
	noMatches: string;
	matchCount: (current: number, total: number) => string;
	replacedCount: (count: number) => string;
}

export const baseViewerUiI18n: I18nDict<BaseViewerUiI18n> = {
	zh: {
		treeView: '树形视图',
		sourceView: '源码视图',
		format: '格式化',
		valid: '✓ 有效',
		invalid: '✗ 无效',
		stats: (viewCount, depth) => `${viewCount} 个视图 · 深度 ${depth}`,
		fileSizeBytes: (bytes) =>
			bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`,
		searchPlaceholder: '搜索…',
		replacePlaceholder: '替换为…',
		prevMatch: '上一个',
		nextMatch: '下一个',
		replaceOne: '替换',
		replaceAll: '全部替换',
		noMatches: '无匹配',
		matchCount: (current, total) => `${current} / ${total}`,
		replacedCount: (count) => `已替换 ${count} 处`,
	},
	en: {
		treeView: 'Tree view',
		sourceView: 'Source view',
		format: 'Format',
		valid: '✓ Valid',
		invalid: '✗ Invalid',
		stats: (viewCount, depth) => `${viewCount} views · Depth ${depth}`,
		fileSizeBytes: (bytes) =>
			bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`,
		searchPlaceholder: 'Search…',
		replacePlaceholder: 'Replace with…',
		prevMatch: 'Prev',
		nextMatch: 'Next',
		replaceOne: 'Replace',
		replaceAll: 'Replace all',
		noMatches: 'No matches',
		matchCount: (current, total) => `${current} / ${total}`,
		replacedCount: (count) => `Replaced ${count}`,
	},
};
