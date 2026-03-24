import type { I18nDict } from '../../locale';

interface ExportModalI18n {
	/** Modal title. */
	title: (basename: string) => string;
	formatLabel: string;
	formatDesc: string;
	/** Dropdown option labels. */
	formatMarkdown: string;
	formatHtml: string;
	formatPdf: string;
	cancelBtn: string;
	exportBtn: string;
	/** Format description paragraphs. */
	descMarkdown: string;
	descHtml: string;
	descPdf: string;
	/** Notice after a successful export. */
	exportedTo: (path: string) => string;
	/** Notice when export throws. */
	exportFailed: string;
	/** Notice when the pdf command is unavailable. */
	pdfFallback: string;
}

export const exportModalI18n: I18nDict<ExportModalI18n> = {
	zh: {
		title: (b) => `导出：${b}`,
		formatLabel: '导出格式',
		formatDesc: '选择此笔记的输出格式。',
		formatMarkdown: 'Markdown（.md）— 标准化清理版',
		formatHtml: 'HTML（.html）— 独立文档',
		formatPdf: 'PDF — 通过 Obsidian 打印对话框',
		cancelBtn: '取消',
		exportBtn: '导出',
		descMarkdown:
			'移除 Obsidian 专有语法（Wiki 链接、嵌入、高亮），保存为 Vault 根目录下的 .md 文件。',
		descHtml:
			'将笔记转换为带内联样式的独立 HTML 文档，保存到 Vault 根目录。',
		descPdf:
			'打开系统打印对话框，选择"打印为 PDF"。建议在阅读模式下操作以获得最佳效果。',
		exportedTo: (path) => `已导出到 ${path}`,
		exportFailed: '导出失败，请查看开发者控制台获取详情。',
		pdfFallback:
			'PDF 导出：\n请在阅读模式下打开笔记，然后使用"文件 > 导出为 PDF"。',
	},
	en: {
		title: (b) => `Export: ${b}`,
		formatLabel: 'Export format',
		formatDesc: 'Choose the output format for this note.',
		formatMarkdown: 'Markdown (.md) — cleaned, standard',
		formatHtml: 'HTML (.html) — self-contained document',
		formatPdf: 'PDF — via Obsidian print dialog',
		cancelBtn: 'Cancel',
		exportBtn: 'Export',
		descMarkdown:
			'Removes Obsidian-specific syntax (wiki links, embeds, highlights) and saves a clean .md file in the vault root.',
		descHtml:
			'Converts the note to a self-contained HTML document with embedded styles. Saved to vault root.',
		descPdf:
			'Opens the system print dialog. Choose "Save as PDF" in the dialog. The note must be open in Reading View for best results.',
		exportedTo: (path) => `Exported to ${path}`,
		exportFailed: 'Export failed. See developer console for details.',
		pdfFallback:
			'PDF export:\nOpen the note in Reading View, then use File > Export as PDF.',
	},
};
