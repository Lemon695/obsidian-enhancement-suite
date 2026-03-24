import type { I18nDict } from '../../locale';

interface TableCommandsI18n {
	sortAsc: { name: string };
	sortDesc: { name: string };
}

export const tableCommandsI18n: I18nDict<TableCommandsI18n> = {
	zh: {
		sortAsc: { name: '表格：当前列升序排序' },
		sortDesc: { name: '表格：当前列降序排序' },
	},
	en: {
		sortAsc: { name: 'Table: Sort current column ascending' },
		sortDesc: { name: 'Table: Sort current column descending' },
	},
};
