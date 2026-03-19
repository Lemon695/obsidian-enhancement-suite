import type { I18nDict } from '../../locale';

interface TableSettingsI18n {
	enableSorting: { name: string; desc: string };
	enableFiltering: { name: string; desc: string };
}

export const tableSettingsI18n: I18nDict<TableSettingsI18n> = {
	zh: {
		enableSorting: {
			name: '启用列排序',
			desc: '点击表头可按该列对行进行排序。',
		},
		enableFiltering: {
			name: '启用行筛选',
			desc: '在表格上方显示文本输入框，用于过滤可见行。',
		},
	},
	en: {
		enableSorting: {
			name: 'Enable column sorting',
			desc: 'Click a table header to sort rows by that column.',
		},
		enableFiltering: {
			name: 'Enable row filtering',
			desc: 'Show a text input above each table to filter visible rows.',
		},
	},
};
