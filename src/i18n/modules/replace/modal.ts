import type { I18nDict } from '../../locale';

interface ReplaceModalI18n {
	title: string;
	findLabel: string;
	findPlaceholder: string;
	replaceLabel: string;
	replacePlaceholder: string;
	optionsLabel: string;
	caseSensitiveTooltip: string;
	regexTooltip: string;
	replaceBtn: string;
	replaceAllBtn: string;
	/** statusEl text when there is no active Markdown editor. */
	noActiveNote: string;
	/** statusEl text when the search returns zero results. */
	noMatchesFound: string;
	/** statusEl text showing how many matches were found. */
	matchCount: (n: number) => string;
	/** Overflow hint below the result list when matches exceed 50. */
	overflowHint: (extra: number) => string;
	/** Notice when Replace / Replace All is clicked but there are no matches. */
	noMatchesReplace: string;
	/** Notice after replacing N occurrences. */
	replacedCount: (n: number) => string;
}

export const replaceModalI18n: I18nDict<ReplaceModalI18n> = {
	zh: {
		title: '搜索与替换',
		findLabel: '搜索',
		findPlaceholder: '搜索内容...',
		replaceLabel: '替换为',
		replacePlaceholder: '替换为...',
		optionsLabel: '选项',
		caseSensitiveTooltip: '区分大小写',
		regexTooltip: '正则表达式',
		replaceBtn: '替换',
		replaceAllBtn: '全部替换',
		noActiveNote: '没有打开的笔记。',
		noMatchesFound: '未找到匹配项。',
		matchCount: (n) => `找到 ${n} 处匹配`,
		overflowHint: (extra) => `... 还有 ${extra} 处匹配（仅预览前 50 条）`,
		noMatchesReplace: '没有可替换的匹配项。',
		replacedCount: (n) => `已替换 ${n} 处。`,
	},
	en: {
		title: 'Find and Replace',
		findLabel: 'Find',
		findPlaceholder: 'Search for...',
		replaceLabel: 'Replace with',
		replacePlaceholder: 'Replace with...',
		optionsLabel: 'Options',
		caseSensitiveTooltip: 'Case sensitive',
		regexTooltip: 'Regular expression',
		replaceBtn: 'Replace',
		replaceAllBtn: 'Replace All',
		noActiveNote: 'No active note.',
		noMatchesFound: 'No matches found.',
		matchCount: (n) => `${n} match${n === 1 ? '' : 'es'} found`,
		overflowHint: (extra) =>
			`... and ${extra} more match${extra === 1 ? '' : 'es'} (showing first 50)`,
		noMatchesReplace: 'No matches to replace.',
		replacedCount: (n) => `Replaced ${n} occurrence${n === 1 ? '' : 's'}.`,
	},
};
