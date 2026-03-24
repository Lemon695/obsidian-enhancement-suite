import type { I18nDict } from '../../locale';

interface FootnotesModuleI18n {
	name: string;
	description: string;
}

export const footnotesModuleI18n: I18nDict<FootnotesModuleI18n> = {
	zh: {
		name: '脚注工具',
		description: '提供脚注插入、编号整理与孤立脚注清理命令。',
	},
	en: {
		name: 'Footnote Tools',
		description: 'Commands for inserting, renumbering, and cleaning orphan footnotes.',
	},
};
