import type { I18nDict } from '../../locale';

interface ReplaceModuleI18n {
	name: string;
	description: string;
}

export const replaceModuleI18n: I18nDict<ReplaceModuleI18n> = {
	zh: {
		name: '文本替换',
		description: '在当前笔记中进行支持正则和大小写的高级搜索替换。',
	},
	en: {
		name: 'Text Replace',
		description:
			'Find and replace text in the current note with regex and case-sensitivity support.',
	},
};
