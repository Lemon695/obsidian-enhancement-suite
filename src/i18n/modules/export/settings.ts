import type { I18nDict } from '../../locale';

interface ExportSettingsI18n {
	defaultFormat: { name: string; desc: string };
	formatMarkdown: string;
	formatHtml: string;
	formatPdf: string;
}

export const exportSettingsI18n: I18nDict<ExportSettingsI18n> = {
	zh: {
		defaultFormat: {
			name: '默认导出格式',
			desc: '打开导出对话框时预先选中的格式。',
		},
		formatMarkdown: 'Markdown',
		formatHtml: 'HTML',
		formatPdf: 'PDF',
	},
	en: {
		defaultFormat: {
			name: 'Default export format',
			desc: 'Pre-selected format when the export dialog opens.',
		},
		formatMarkdown: 'Markdown',
		formatHtml: 'HTML',
		formatPdf: 'PDF',
	},
};
