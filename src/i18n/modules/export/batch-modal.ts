import type { I18nDict } from '../../locale';

interface ExportBatchModalI18n {
	title: string;
	scopeLabel: string;
	scopeVault: string;
	scopeFolder: string;
	scopeTag: string;
	tagInputLabel: string;
	tagInputPlaceholder: string;
	formatLabel: string;
	formatMarkdown: string;
	formatHtml: string;
	previewLabel: (count: number) => string;
	previewEmpty: string;
	previewMore: (n: number) => string;
	noActiveFile: string;
	cancelBtn: string;
	exportBtn: string;
	exporting: (current: number, total: number) => string;
	exportDone: (count: number, folder: string) => string;
	exportFailed: string;
}

export const exportBatchModalI18n: I18nDict<ExportBatchModalI18n> = {
	zh: {
		title: '批量导出笔记',
		scopeLabel: '导出范围',
		scopeVault: '整个 Vault',
		scopeFolder: '当前文件夹',
		scopeTag: '指定标签',
		tagInputLabel: '标签名称',
		tagInputPlaceholder: '例：project（不需要 # 号）',
		formatLabel: '导出格式',
		formatMarkdown: 'Markdown（.md）',
		formatHtml: 'HTML（.html）',
		previewLabel: (count) => `将导出 ${count} 个文件`,
		previewEmpty: '没有符合条件的文件',
		previewMore: (n) => `……以及另外 ${n} 个文件`,
		noActiveFile: '需要先打开一个文件才能使用「当前文件夹」范围。',
		cancelBtn: '取消',
		exportBtn: '开始导出',
		exporting: (current, total) => `正在导出 ${current} / ${total}…`,
		exportDone: (count, folder) => `已导出 ${count} 个文件到 ${folder}`,
		exportFailed: '批量导出失败，请查看开发者控制台获取详情。',
	},
	en: {
		title: 'Batch Export Notes',
		scopeLabel: 'Export scope',
		scopeVault: 'Entire vault',
		scopeFolder: 'Current folder',
		scopeTag: 'By tag',
		tagInputLabel: 'Tag name',
		tagInputPlaceholder: 'e.g. project (without # sign)',
		formatLabel: 'Export format',
		formatMarkdown: 'Markdown (.md)',
		formatHtml: 'HTML (.html)',
		previewLabel: (count) => `${count} file${count !== 1 ? 's' : ''} will be exported`,
		previewEmpty: 'No files match the current criteria',
		previewMore: (n) => `…and ${n} more`,
		noActiveFile: 'Open a file first to use the "Current folder" scope.',
		cancelBtn: 'Cancel',
		exportBtn: 'Start export',
		exporting: (current, total) => `Exporting ${current} / ${total}…`,
		exportDone: (count, folder) => `Exported ${count} file${count !== 1 ? 's' : ''} to ${folder}`,
		exportFailed: 'Batch export failed. See developer console for details.',
	},
};
