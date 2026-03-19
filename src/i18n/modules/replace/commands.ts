import type { I18nDict } from '../../locale';

interface ReplaceCommandsI18n {
	openPanel: { name: string };
}

export const replaceCommandsI18n: I18nDict<ReplaceCommandsI18n> = {
	zh: {
		openPanel: { name: '替换：打开搜索替换面板' },
	},
	en: {
		openPanel: { name: 'Replace: Open find-and-replace panel' },
	},
};
