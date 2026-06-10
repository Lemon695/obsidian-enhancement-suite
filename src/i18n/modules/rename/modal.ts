import type { I18nDict } from '../../locale';

interface RenameModalI18n {
	title: string;
	currentName: string;
	newNameLabel: string;
	invalidFilenameError: string;
	typePrefix: string;
	typeSuffix: string;
	typeReplace: string;
	patterns: Record<string, string>;
	customPlaceholder: string;
	previewLabel: string;
	confirmBtn: string;
	cancelBtn: string;
	noFileOpen: string;
	renameSuccess: (newName: string) => string;
	renameFailed: string;
	// batch confirm
	batchConfirmTitle: (count: number) => string;
	batchConfirmPreviewLabel: string;
	batchConfirmBtn: (count: number) => string;
	batchConfirmMoreFiles: (n: number) => string;
}

export const renameModalI18n: I18nDict<RenameModalI18n> = {
	zh: {
		title: '快速重命名',
		currentName: '当前文件名',
		newNameLabel: '新文件名',
		invalidFilenameError: '文件名不合法（不能含 / 或 \\，且不能为空）',
		typePrefix: '前缀',
		typeSuffix: '后缀',
		typeReplace: '替换',
		patterns: {
			'date-prefix':      '日期前缀',
			'timestamp-prefix': '时间戳前缀',
			'uuid-prefix':      'UUID 前缀',
			'hash-prefix':      '哈希前缀',
			'custom-prefix':    '自定义前缀',
			'date-suffix':      '日期后缀',
			'hash-suffix':      '哈希后缀',
			'custom-suffix':    '自定义后缀',
			'date-uuid-replace': '日期+UUID',
			'date-replace':     '替换为日期',
			'uuid-replace':     '替换为 UUID',
			'hash-replace':     '替换为哈希',
			'custom-replace':   '替换为自定义文字',
		},
		customPlaceholder: '输入自定义文字',
		previewLabel: '预览',
		confirmBtn: '确认重命名',
		cancelBtn: '取消',
		noFileOpen: '没有打开的文件',
		renameSuccess: (n) => `已重命名为：${n}`,
		renameFailed: '重命名失败，请查看开发者控制台。',
		batchConfirmTitle: (n) => `批量重命名 ${n} 个文件`,
		batchConfirmPreviewLabel: '预览（前 5 个文件）',
		batchConfirmBtn: (n) => `确认重命名 ${n} 个文件`,
		batchConfirmMoreFiles: (n) => `……另有 ${n} 个文件`,
	},
	en: {
		title: 'Quick Rename',
		currentName: 'Current filename',
		newNameLabel: 'New filename',
		invalidFilenameError: 'Invalid filename (cannot contain / or \\, and must not be empty)',
		typePrefix: 'Prefix',
		typeSuffix: 'Suffix',
		typeReplace: 'Replace',
		patterns: {
			'date-prefix':      'Date prefix',
			'timestamp-prefix': 'Timestamp prefix',
			'uuid-prefix':      'UUID prefix',
			'hash-prefix':      'Hash prefix',
			'custom-prefix':    'Custom prefix',
			'date-suffix':      'Date suffix',
			'hash-suffix':      'Hash suffix',
			'custom-suffix':    'Custom suffix',
			'date-uuid-replace': 'Date+UUID',
			'date-replace':     'Replace with date',
			'uuid-replace':     'Replace with UUID',
			'hash-replace':     'Replace with hash',
			'custom-replace':   'Replace with custom text',
		},
		customPlaceholder: 'Enter custom text',
		previewLabel: 'Preview',
		confirmBtn: 'Confirm rename',
		cancelBtn: 'Cancel',
		noFileOpen: 'No file is currently open',
		renameSuccess: (n) => `Renamed to: ${n}`,
		renameFailed: 'Rename failed. See developer console for details.',
		batchConfirmTitle: (n) => `Batch rename ${n} files`,
		batchConfirmPreviewLabel: 'Preview (first 5 files)',
		batchConfirmBtn: (n) => `Rename ${n} files`,
		batchConfirmMoreFiles: (n) => `…and ${n} more files`,
	},
};
