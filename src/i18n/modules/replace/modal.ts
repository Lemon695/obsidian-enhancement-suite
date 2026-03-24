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
	// --- Cross-file scope ---
	scopeLabel: string;
	scopeFile: string;
	scopeFolder: string;
	scopeVault: string;
	searching: string;
	foundInFiles: (fileCount: number, totalMatches: number) => string;
	fileGroupHeader: (filePath: string, matchCount: number) => string;
	replaceInFileBtn: string;
	replaceAllFilesBtn: string;
	replaceAllFilesWarning: (fileCount: number) => string;
	replacedInFiles: (fileCount: number, totalCount: number) => string;
	noActiveFolder: string;
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
		scopeLabel: '搜索范围',
		scopeFile: '当前文件',
		scopeFolder: '当前文件夹',
		scopeVault: '整个 Vault',
		searching: '搜索中...',
		foundInFiles: (f, total) => `在 ${f} 个文件中找到 ${total} 处匹配`,
		fileGroupHeader: (path, n) => `${path}（${n} 处）`,
		replaceInFileBtn: '替换此文件',
		replaceAllFilesBtn: '全部替换（所有文件）',
		replaceAllFilesWarning: (f) =>
			`将对 ${f} 个文件执行跨文件替换，此操作不可撤销，确认继续？`,
		replacedInFiles: (f, total) => `已在 ${f} 个文件中替换 ${total} 处。`,
		noActiveFolder: '无法确定当前文件夹，请先打开一个笔记。',
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
		scopeLabel: 'Search scope',
		scopeFile: 'Current file',
		scopeFolder: 'Current folder',
		scopeVault: 'Entire vault',
		searching: 'Searching...',
		foundInFiles: (f, total) =>
			`Found ${total} match${total === 1 ? '' : 'es'} in ${f} file${f === 1 ? '' : 's'}`,
		fileGroupHeader: (path, n) => `${path} (${n} match${n === 1 ? '' : 'es'})`,
		replaceInFileBtn: 'Replace in this file',
		replaceAllFilesBtn: 'Replace All (all files)',
		replaceAllFilesWarning: (f) =>
			`Replace across ${f} file${f === 1 ? '' : 's'}? This cannot be undone.`,
		replacedInFiles: (f, total) =>
			`Replaced ${total} occurrence${total === 1 ? '' : 's'} in ${f} file${f === 1 ? '' : 's'}.`,
		noActiveFolder: 'Could not determine the current folder. Please open a note first.',
	},
};
