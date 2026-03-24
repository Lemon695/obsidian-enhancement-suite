import type { I18nDict } from '../../locale';

interface ExportModuleI18n {
	name: string;
	description: string;
}

export const exportModuleI18n: I18nDict<ExportModuleI18n> = {
	zh: {
		name: '导出增强',
		description:
			'将笔记导出为 Markdown、HTML 或 PDF，并自动清理 Obsidian 专有语法。',
	},
	en: {
		name: 'Export Enhancement',
		description:
			'Export notes to Markdown, HTML, or PDF with Obsidian-specific syntax cleaned up.',
	},
};
