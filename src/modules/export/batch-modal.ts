import { App, Modal, Notice, Setting, TFile } from 'obsidian';
import type EnhancementSuitePlugin from '../../main';
import { cleanMarkdownForExport, markdownToHtml, embedImages } from './formatter';
import { filterFilesByScope, type ExportScope, type FileRecord } from './batch-filter';
import { t } from '../../i18n/locale';
import { exportBatchModalI18n } from '../../i18n/modules/export/batch-modal';

/** 批量导出弹窗支持的格式（不含 PDF）。 */
type BatchFormat = 'markdown' | 'html';

/** 每次批量导出的输出文件夹名格式：batch-export-YYYYMMDD-HHmmss */
function buildOutputFolder(): string {
	const now = new Date();
	const pad = (n: number, len = 2): string => String(n).padStart(len, '0');
	return [
		'batch-export',
		`${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`,
		`${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
	].join('-');
}

/**
 * 批量导出弹窗。
 *
 * 工作流：
 *   1. 用户选择导出范围（整个 Vault / 当前文件夹 / 指定标签）
 *   2. 用户选择格式（Markdown / HTML）
 *   3. 预览文件列表（最多显示 20 条 + "以及另外 N 个"）
 *   4. 点击「开始导出」，逐文件处理，进度通过 Notice 展示
 *   5. 输出到 Vault 根目录的子文件夹 batch-export-YYYYMMDD-HHmmss/
 */
export class BatchExportModal extends Modal {
	private exportScope: ExportScope = 'vault';
	private format: BatchFormat = 'markdown';
	private tagInput = '';
	private previewEl!: HTMLElement;
	private readonly i18n = t(exportBatchModalI18n);

	constructor(
		app: App,
		private readonly plugin: EnhancementSuitePlugin
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl, i18n } = this;
		this.titleEl.setText(i18n.title);

		// --- 导出范围 ---
		new Setting(contentEl)
			.setName(i18n.scopeLabel)
			.addDropdown((dd) =>
				dd
					.addOption('vault', i18n.scopeVault)
					.addOption('folder', i18n.scopeFolder)
					.addOption('tag', i18n.scopeTag)
					.setValue(this.exportScope)
					.onChange((v) => {
						this.exportScope = v as ExportScope;
						this.refreshTagRow(contentEl);
						this.refreshPreview();
					})
			);

		// --- 标签输入行（scope=tag 时显示）---
		this.buildTagRow(contentEl);

		// --- 导出格式 ---
		new Setting(contentEl)
			.setName(i18n.formatLabel)
			.addDropdown((dd) =>
				dd
					.addOption('markdown', i18n.formatMarkdown)
					.addOption('html', i18n.formatHtml)
					.setValue(this.format)
					.onChange((v) => {
						this.format = v as BatchFormat;
					})
			);

		// --- 文件预览 ---
		this.previewEl = contentEl.createDiv({ cls: 'es-export-batch-preview' });
		this.refreshPreview();

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
						this.doBatchExport().catch((e) => {
							console.error('[enhancement-suite] Batch export failed:', e);
							new Notice(i18n.exportFailed);
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

	/** 构建标签输入行（初次调用）。 */
	private buildTagRow(containerEl: HTMLElement): void {
		const row = containerEl.createDiv({ cls: 'es-export-batch-tag-row' });
		row.style.display = this.exportScope === 'tag' ? '' : 'none';

		new Setting(row)
			.setName(this.i18n.tagInputLabel)
			.addText((text) =>
				text
					.setPlaceholder(this.i18n.tagInputPlaceholder)
					.setValue(this.tagInput)
					.onChange((v) => {
						this.tagInput = v.trim();
						this.refreshPreview();
					})
			);
	}

	/** 切换 scope 时显示/隐藏标签输入行。 */
	private refreshTagRow(containerEl: HTMLElement): void {
		const row = containerEl.querySelector<HTMLElement>('.es-export-batch-tag-row');
		if (row) row.style.display = this.exportScope === 'tag' ? '' : 'none';
	}

	/** 刷新文件预览列表。 */
	private refreshPreview(): void {
		this.previewEl.empty();
		const files = this.getFilteredFiles();
		const { i18n } = this;

		if (files.length === 0) {
			this.previewEl.createEl('p', {
				text: i18n.previewEmpty,
				cls: 'es-export-batch-preview-empty',
			});
			return;
		}

		this.previewEl.createEl('p', {
			text: i18n.previewLabel(files.length),
			cls: 'es-export-batch-preview-count',
		});

		const list = this.previewEl.createEl('ul', { cls: 'es-export-batch-file-list' });
		const MAX_SHOWN = 20;
		files.slice(0, MAX_SHOWN).forEach((f) => {
			list.createEl('li', { text: f.path });
		});
		if (files.length > MAX_SHOWN) {
			list.createEl('li', {
				text: i18n.previewMore(files.length - MAX_SHOWN),
				cls: 'es-export-batch-more',
			});
		}
	}

	/**
	 * 获取当前设置下过滤后的 Vault 文件列表。
	 * 将 TFile 转换为 FileRecord 后交给纯函数过滤。
	 */
	private getFilteredFiles(): TFile[] {
		const allFiles = this.app.vault.getMarkdownFiles();
		const currentFile = this.app.workspace.getActiveFile();
		const currentFolderPath = currentFile?.parent?.path ?? null;

		// 将 TFile 转为 FileRecord（提取标签供过滤函数使用）
		const records: FileRecord[] = allFiles.map((f) => ({
			path: f.path,
			tags: this.getFileTags(f),
		}));

		const filtered = filterFilesByScope(
			records,
			this.exportScope,
			// folder scope 时传入当前文件夹路径；tag scope 时传 null 即可
			this.exportScope === 'folder' ? currentFolderPath : null,
			this.tagInput
		);

		// 将过滤结果映射回 TFile
		const filteredPaths = new Set(filtered.map((r) => r.path));
		return allFiles.filter((f) => filteredPaths.has(f.path));
	}

	/** 从 Obsidian 元数据缓存读取文件的标签列表。 */
	private getFileTags(file: TFile): string[] {
		const cache = this.app.metadataCache.getFileCache(file);
		const tagItems = cache?.tags ?? [];
		return tagItems.map((t) => t.tag);
	}

	/** 执行批量导出。 */
	private async doBatchExport(): Promise<void> {
		const { i18n } = this;
		const files = this.getFilteredFiles();

		if (files.length === 0) return;

		// 当 scope=folder 且无活跃文件时给出提示
		if (this.exportScope === 'folder' && !this.app.workspace.getActiveFile()) {
			new Notice(i18n.noActiveFile);
			return;
		}

		this.close();

		const outputFolder = buildOutputFolder();
		let successCount = 0;

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			if (!file) continue;

			new Notice(i18n.exporting(i + 1, files.length), 1500);

			try {
				const content = await this.app.vault.read(file);

				if (this.format === 'markdown') {
					await this.exportOneMarkdown(file, content, outputFolder);
				} else {
					await this.exportOneHtml(file, content, outputFolder);
				}
				successCount++;
			} catch (e) {
				console.error(`[enhancement-suite] Failed to export ${file.path}:`, e);
			}
		}

		new Notice(i18n.exportDone(successCount, outputFolder));
	}

	/** 导出单个文件为 Markdown。 */
	private async exportOneMarkdown(
		file: TFile,
		content: string,
		outputFolder: string
	): Promise<void> {
		const cleaned = cleanMarkdownForExport(content);
		const outputPath = `${outputFolder}/${file.basename}.md`;
		await this.ensureFolder(outputFolder);
		await this.createOrModify(outputPath, cleaned);
	}

	/** 导出单个文件为 HTML。 */
	private async exportOneHtml(
		file: TFile,
		content: string,
		outputFolder: string
	): Promise<void> {
		const cleaned = cleanMarkdownForExport(content);
		let html = markdownToHtml(file.basename, cleaned);

		if (this.plugin.settings.export.embedImages) {
			html = await embedImages(html, this.app);
		}

		const outputPath = `${outputFolder}/${file.basename}.html`;
		await this.ensureFolder(outputFolder);
		await this.createOrModify(outputPath, html);
	}

	/** 确保文件夹存在（不存在则创建）。 */
	private async ensureFolder(folderPath: string): Promise<void> {
		if (!this.app.vault.getAbstractFileByPath(folderPath)) {
			await this.app.vault.createFolder(folderPath);
		}
	}

	/** 写入文件；若同名文件已存在则覆盖（modify）。 */
	private async createOrModify(path: string, content: string): Promise<void> {
		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing instanceof TFile) {
			await this.app.vault.modify(existing, content);
		} else {
			await this.app.vault.create(path, content);
		}
	}
}
