import type { I18nDict } from '../../locale';

interface CalloutModuleI18n {
	name: string;
	description: string;
}

export const calloutModuleI18n: I18nDict<CalloutModuleI18n> = {
	zh: {
		name: 'Callout 工具',
		description: '通过模糊搜索快速插入 Obsidian 内置 Callout 块。',
	},
	en: {
		name: 'Callout Tools',
		description: 'Quickly insert Obsidian built-in callout blocks via fuzzy search.',
	},
};
