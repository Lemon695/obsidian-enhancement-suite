import type { I18nDict } from '../../locale';

interface ExportSettingsI18n {
	defaultFormat: { name: string; desc: string };
	formatMarkdown: string;
	formatHtml: string;
	formatPdf: string;
	embedImages: { name: string; desc: string };
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
		embedImages: {
			name: '导出时内嵌图片',
			desc: '导出 HTML 时将 vault 内的图片转为 Base64 内嵌，实现真正的单文件交付（默认关闭）。',
		},
	},
	en: {
		defaultFormat: {
			name: 'Default export format',
			desc: 'Pre-selected format when the export dialog opens.',
		},
		formatMarkdown: 'Markdown',
		formatHtml: 'HTML',
		formatPdf: 'PDF',
		embedImages: {
			name: 'Embed images in HTML',
			desc: 'Convert vault images to Base64 data URIs when exporting HTML, producing a fully self-contained file. Off by default.',
		},
	},
};
