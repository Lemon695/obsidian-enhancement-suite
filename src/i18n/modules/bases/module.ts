import type { I18nDict } from '../../locale';

interface BasesModuleI18n {
	name: string;
	description: string;
}

export const basesModuleI18n: I18nDict<BasesModuleI18n> = {
	zh: {
		name: 'Bases 集成',
		description:
			'为 Obsidian Bases 添加自定义视图类型：Markdown 表格视图（支持列排序和一键复制为 Markdown）。需要 Obsidian ≥ 1.10 并在核心插件中启用 Bases。',
	},
	en: {
		name: 'Bases Integration',
		description:
			'Adds a custom view type to Obsidian Bases: Markdown Table View with column sorting and one-click copy as Markdown. Requires Obsidian ≥ 1.10 with Bases core plugin enabled.',
	},
};
