import type { I18nDict } from '../../locale';

interface ProgressModuleI18n {
	name: string;
	description: string;
}

export const progressModuleI18n: I18nDict<ProgressModuleI18n> = {
	zh: {
		name: '阅读进度条',
		description: '在阅读模式顶部显示细进度条，随滚动位置实时更新。',
	},
	en: {
		name: 'Reading Progress',
		description: 'Show a slim progress bar at the top of reading view, updated on scroll.',
	},
};
