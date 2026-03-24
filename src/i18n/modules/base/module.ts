import type { I18nDict } from '../../locale';

interface BaseModuleI18n {
	name: string;
	description: string;
}

export const baseModuleI18n: I18nDict<BaseModuleI18n> = {
	zh: {
		name: 'Base 文件查看器',
		description: '为 .base 文件提供树形查看与编辑视图，支持右键菜单快速打开。',
	},
	en: {
		name: 'Base File Viewer',
		description: 'Tree viewer and editor for .base files, with right-click menu integration.',
	},
};
