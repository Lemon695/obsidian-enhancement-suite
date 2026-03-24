import type { I18nDict } from '../../locale';

interface TableModuleI18n {
	name: string;
	description: string;
}

export const tableModuleI18n: I18nDict<TableModuleI18n> = {
	zh: {
		name: '表格增强',
		description: '为阅读模式下的 Markdown 表格添加列排序和行筛选功能。',
	},
	en: {
		name: 'Table Enhancement',
		description:
			'Add column sorting and row filtering to Markdown tables in Reading View.',
	},
};
