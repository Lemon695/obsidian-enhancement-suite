import type { I18nDict } from '../../locale';

interface StatsModuleI18n {
	name: string;
	description: string;
	statusText: (wordCount: number, readMinutes: number) => string;
}

export const statsModuleI18n: I18nDict<StatsModuleI18n> = {
	zh: {
		name: '字数统计',
		description: '在状态栏实时显示当前笔记的字数与预计阅读时间。',
		statusText: (w, m) => `词: ${w}  约 ${m} 分钟`,
	},
	en: {
		name: 'Word Count',
		description: 'Show word count and estimated reading time in the status bar.',
		statusText: (w, m) => `${w} words  ~${m} min`,
	},
};
