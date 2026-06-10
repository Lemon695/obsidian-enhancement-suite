import type { I18nDict } from '../../locale';

interface RenamePanelI18n {
	title: string;
	searchPlaceholder: string;
	filterType: string;
	filterTypeAll: string;
	filterTypeMarkdown: string;
	filterTypeImage: string;
	filterTypeVideo: string;
	filterTypeAudio: string;
	filterTypePdf: string;
	filterTypeCanvas: string;
	filterTypeOther: string;
	filterDateFrom: string;
	filterDateTo: string;
	clearFilters: string;
	columnName: string;
	columnType: string;
	columnModified: string;
	columnActions: string;
	renameBtn: string;
	selectAll: string;
	deselectAll: string;
	patternLabel: string;
	customTextLabel: string;
	customTextPlaceholder: string;
	previewLabel: string;
	confirmBtn: string;
	cancelBtn: string;
	bulkRenameBtn: (n: number) => string;
	noFiles: string;
	pageInfo: (current: number, total: number) => string;
	prevPage: string;
	nextPage: string;
	renameSuccess: (newName: string) => string;
	renameFailed: string;
}

export const renamePanelI18n: I18nDict<RenamePanelI18n> = {
	zh: {
		title: '批量重命名',
		searchPlaceholder: '搜索文件名…',
		filterType: '文件类型',
		filterTypeAll: '全部',
		filterTypeMarkdown: 'Markdown',
		filterTypeImage: '图片',
		filterTypeVideo: '视频',
		filterTypeAudio: '音频',
		filterTypePdf: 'PDF',
		filterTypeCanvas: 'Canvas',
		filterTypeOther: '其他',
		filterDateFrom: '修改日期从',
		filterDateTo: '修改日期至',
		clearFilters: '清除筛选',
		columnName: '文件名',
		columnType: '类型',
		columnModified: '修改时间',
		columnActions: '操作',
		renameBtn: '重命名',
		selectAll: '全选',
		deselectAll: '取消全选',
		patternLabel: '重命名模式',
		customTextLabel: '自定义文字',
		customTextPlaceholder: '输入前缀或后缀',
		previewLabel: '预览',
		confirmBtn: '确认',
		cancelBtn: '取消',
		bulkRenameBtn: (n) => `批量重命名已选中 (${n})`,
		noFiles: '无匹配文件',
		pageInfo: (current, total) => `第 ${current} 页，共 ${total} 页`,
		prevPage: '上一页',
		nextPage: '下一页',
		renameSuccess: (n) => `已重命名为：${n}`,
		renameFailed: '重命名失败，请查看开发者控制台。',
	},
	en: {
		title: 'Batch Rename',
		searchPlaceholder: 'Search filename…',
		filterType: 'File type',
		filterTypeAll: 'All',
		filterTypeMarkdown: 'Markdown',
		filterTypeImage: 'Image',
		filterTypeVideo: 'Video',
		filterTypeAudio: 'Audio',
		filterTypePdf: 'PDF',
		filterTypeCanvas: 'Canvas',
		filterTypeOther: 'Other',
		filterDateFrom: 'Modified from',
		filterDateTo: 'Modified to',
		clearFilters: 'Clear filters',
		columnName: 'Filename',
		columnType: 'Type',
		columnModified: 'Modified',
		columnActions: 'Actions',
		renameBtn: 'Rename',
		selectAll: 'Select all',
		deselectAll: 'Deselect all',
		patternLabel: 'Rename pattern',
		customTextLabel: 'Custom text',
		customTextPlaceholder: 'Enter prefix or suffix',
		previewLabel: 'Preview',
		confirmBtn: 'Confirm',
		cancelBtn: 'Cancel',
		bulkRenameBtn: (n) => `Bulk rename selected (${n})`,
		noFiles: 'No files match',
		pageInfo: (current, total) => `Page ${current} of ${total}`,
		prevPage: 'Previous',
		nextPage: 'Next',
		renameSuccess: (n) => `Renamed to: ${n}`,
		renameFailed: 'Rename failed. See developer console for details.',
	},
};
