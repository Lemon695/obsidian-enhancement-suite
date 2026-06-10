import { App, Modal, Notice, Setting, TFile } from 'obsidian';
import type EnhancementSuitePlugin from '../../main';
import { cleanMarkdownForExport, markdownToHtml, embedImages } from './formatter';
import { t } from '../../i18n/locale';
import { exportModalI18n } from '../../i18n/modules/export/modal';

type ExportFormat = 'markdown' | 'html' | 'pdf';

/**
 * 导出对话框。
 *
 * 工作流：
 *   1. 用户选择导出格式（Markdown / HTML / PDF 提示）
 *   2. 点击 Export 按钮，读取当前文件内容
 *   3. 对于 Markdown/HTML：清理内容后写入 Vault 根目录的新文件
 *   4. 对于 PDF：显示操作说明（Obsidian 内置 PDF 导出）
 *
 * 输出文件命名规则：`<basename>-export.md` / `<basename>-export.html`
 * 若同名文件已存在，则追加时间戳避免覆盖。
 */
export class ExportModal extends Modal {
	private format: ExportFormat;

	constructor(
		app: App,
		private readonly plugin: EnhancementSuitePlugin,
		private readonly file: TFile
	) {
		super(app);
		this.format = plugin.settings.export.defaultFormat;
	}

	onOpen(): void {
		const { contentEl } = this;
		const i18n = t(exportModalI18n);

		this.titleEl.setText(i18n.title(this.file.basename));
		contentEl.addClass('es-export-modal');

		// --- 格式选择 ---
		new Setting(contentEl)
			.setName(i18n.formatLabel)
			.setDesc(i18n.formatDesc)
			.addDropdown((dropdown) =>
				dropdown
					.addOption('markdown', i18n.formatMarkdown)
					.addOption('html', i18n.formatHtml)
					.addOption('pdf', i18n.formatPdf)
					.setValue(this.format)
					.onChange((value) => {
						this.format = value as ExportFormat;
						this.refreshDescription(descEl);
					})
			);

		// --- 格式说明 ---
		const descEl = contentEl.createDiv({ cls: 'es-export-format-desc' });
		this.refreshDescription(descEl);

		// --- 操作按钮 ---
		new Setting(contentEl)
			.addButton((btn) =>
				btn.setButtonText(i18n.cancelBtn).onClick(() => this.close())
			)
			.addButton((btn) =>
				btn
					.setButtonText(i18n.exportBtn)
					.setCta()
					.onClick(() => {
						this.doExport().catch((e) => {
							console.error('[enhancement-suite] Export failed:', e);
							new Notice(t(exportModalI18n).exportFailed);
						});
					})
			);
	}

	onClose(): void {
		this.contentEl.empty();
	}

	// ---------------------------------------------------------------------------
	// 私有方法
	// ---------------------------------------------------------------------------

	/** 根据当前格式刷新说明文字。 */
	private refreshDescription(el: HTMLElement): void {
		el.empty();
		const i18n = t(exportModalI18n);
		const descriptions: Record<ExportFormat, string> = {
			markdown: i18n.descMarkdown,
			html: i18n.descHtml,
			pdf: i18n.descPdf,
		};
		el.setText(descriptions[this.format] ?? '');
	}

	/** 执行导出操作。 */
	private async doExport(): Promise<void> {
		this.close();

		const content = await this.app.vault.read(this.file);

		if (this.format === 'markdown') {
			await this.exportMarkdown(content);
		} else if (this.format === 'html') {
			await this.exportHtml(content);
		} else {
			this.exportPdf();
		}
	}

	/** 导出为标准 Markdown 文件。 */
	private async exportMarkdown(content: string): Promise<void> {
		const cleaned = cleanMarkdownForExport(content);
		const outputPath = this.resolveOutputPath(`${this.file.basename}-export.md`);
		await this.app.vault.create(outputPath, cleaned);
		new Notice(t(exportModalI18n).exportedTo(outputPath));
	}

	/** 导出为 HTML 文件（可选：内嵌图片为 Base64）。 */
	private async exportHtml(content: string): Promise<void> {
		const cleaned = cleanMarkdownForExport(content);
		let html = markdownToHtml(this.file.basename, cleaned);

		if (this.plugin.settings.export.embedImages) {
			html = await embedImages(html, this.app);
		}

		const outputPath = this.resolveOutputPath(`${this.file.basename}-export.html`);
		await this.app.vault.create(outputPath, html);
		new Notice(t(exportModalI18n).exportedTo(outputPath));
	}

	/**
	 * 触发 PDF 导出。
	 * Obsidian 桌面版内置 PDF 导出命令（workspace:export-pdf）。
	 * 若命令不存在，则显示手动操作说明。
	 */
	private exportPdf(): void {
		// app.commands 是 Obsidian 未公开的内部 API；用类型化的 unknown 转换访问，
		// 避免 any 带来的 no-unsafe-member-access。
		const commands = (
			this.app as unknown as {
				commands?: { executeCommandById: (id: string) => boolean };
			}
		).commands;

		const success = commands?.executeCommandById('workspace:export-pdf');

		if (!success) {
			new Notice(t(exportModalI18n).pdfFallback, 6000);
		}
	}

	/**
	 * 若目标路径已存在，则在文件名中插入时间戳以避免覆盖。
	 */
	private resolveOutputPath(preferred: string): string {
		if (!this.app.vault.getAbstractFileByPath(preferred)) {
			return preferred;
		}
		const ts = Date.now();
		const dot = preferred.lastIndexOf('.');
		return dot === -1
			? `${preferred}-${ts}`
			: `${preferred.slice(0, dot)}-${ts}${preferred.slice(dot)}`;
	}
}
