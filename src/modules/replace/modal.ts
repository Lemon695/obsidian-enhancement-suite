import { App, Editor, MarkdownView, Modal, Notice, Setting, TFile } from 'obsidian';
import type EnhancementSuitePlugin from '../../main';
import {
	SearchMatch,
	MultiFileMatch,
	searchInContent,
	searchInFiles,
	searchAndReplaceInFile,
} from './searcher';
import { t } from '../../i18n/locale';
import { replaceModalI18n } from '../../i18n/modules/replace/modal';
import { commonConfirmI18n } from '../../i18n/common';
import { confirmModal } from '../../core/confirm-modal';

type SearchScope = 'file' | 'folder' | 'vault';

/**
 * 搜索替换对话框。
 *
 * 功能：
 *   - 当前文件：在活跃笔记中搜索/替换（保留 Undo 历史）
 *   - 当前文件夹 / 整个 Vault：跨文件搜索，结果按文件分组展示，
 *     支持「替换此文件」和「全部替换」（使用 vault.modify()，不可撤销）
 *   - 大小写/正则选项与 ReplaceModuleSettings 双向同步
 */
export class ReplaceModal extends Modal {
	private searchTerm = '';
	private replaceTerm = '';
	private searchScope: SearchScope = 'file';

	// 当前文件搜索结果
	private matches: SearchMatch[] = [];
	// 跨文件搜索结果
	private multiFileResults: MultiFileMatch[] = [];

	// 跨文件搜索防抖定时器
	private multiSearchTimer: ReturnType<typeof setTimeout> | null = null;

	// DOM 引用，在 onOpen() 后有效
	private statusEl!: HTMLElement;
	private resultsEl!: HTMLElement;

	constructor(
		app: App,
		private readonly plugin: EnhancementSuitePlugin
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		const i18n = t(replaceModalI18n);

		this.titleEl.setText(i18n.title);
		contentEl.addClass('es-replace-modal');

		// --- 搜索输入框 ---
		new Setting(contentEl)
			.setName(i18n.findLabel)
			.addText((text) => {
				text
					.setPlaceholder(i18n.findPlaceholder)
					.setValue(this.searchTerm)
					.onChange((value) => {
						this.searchTerm = value;
						this.runSearch();
					});
				setTimeout(() => text.inputEl.focus(), 50);
			});

		// --- 替换输入框 ---
		new Setting(contentEl)
			.setName(i18n.replaceLabel)
			.addText((text) =>
				text
					.setPlaceholder(i18n.replacePlaceholder)
					.setValue(this.replaceTerm)
					.onChange((value) => {
						this.replaceTerm = value;
					})
			);

		// --- 选项（大小写 / 正则）---
		new Setting(contentEl)
			.setName(i18n.optionsLabel)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.replace.caseSensitive)
					.setTooltip(i18n.caseSensitiveTooltip)
					.onChange(async (value) => {
						this.plugin.settings.replace.caseSensitive = value;
						await this.plugin.saveSettings();
						this.runSearch();
					})
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.replace.useRegex)
					.setTooltip(i18n.regexTooltip)
					.onChange(async (value) => {
						this.plugin.settings.replace.useRegex = value;
						await this.plugin.saveSettings();
						this.runSearch();
					})
			);

		// --- 搜索范围 ---
		new Setting(contentEl)
			.setName(i18n.scopeLabel)
			.addDropdown((dropdown) =>
				dropdown
					.addOption('file', i18n.scopeFile)
					.addOption('folder', i18n.scopeFolder)
					.addOption('vault', i18n.scopeVault)
					.setValue(this.searchScope)
					.onChange((value) => {
						this.searchScope = value as SearchScope;
						this.runSearch();
					})
			);

		// --- 操作按钮 ---
		new Setting(contentEl)
			.addButton((btn) =>
				btn.setButtonText(i18n.replaceBtn).onClick(() => this.replaceNext())
			)
			.addButton((btn) =>
				btn
					.setButtonText(i18n.replaceAllBtn)
					.setCta()
					.onClick(() => this.replaceAll())
			);

		// --- 状态行 ---
		this.statusEl = contentEl.createDiv({ cls: 'es-replace-status' });

		// --- 结果预览列表 ---
		this.resultsEl = contentEl.createDiv({ cls: 'es-replace-results' });
	}

	onClose(): void {
		if (this.multiSearchTimer !== null) {
			clearTimeout(this.multiSearchTimer);
			this.multiSearchTimer = null;
		}
		this.contentEl.empty();
	}

	// ---------------------------------------------------------------------------
	// 搜索
	// ---------------------------------------------------------------------------

	/** 获取当前活跃 MarkdownView 的 Editor，不存在则返回 null。 */
	private getEditor(): Editor | null {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		return view ? view.editor : null;
	}

	/** 根据当前 scope 分发搜索。 */
	private runSearch(): void {
		if (this.searchScope === 'file') {
			this.runSingleFileSearch();
		} else {
			this.scheduleMultiFileSearch();
		}
	}

	/** 当前文件搜索（同步）。 */
	private runSingleFileSearch(): void {
		const i18n = t(replaceModalI18n);
		const editor = this.getEditor();
		if (!editor) {
			this.statusEl.setText(i18n.noActiveNote);
			this.resultsEl.empty();
			return;
		}

		this.matches = searchInContent(
			editor.getValue(),
			this.searchTerm,
			this.plugin.settings.replace
		);

		this.renderSingleFileResults();
	}

	/** 跨文件搜索防抖调度（500ms）。 */
	private scheduleMultiFileSearch(): void {
		const i18n = t(replaceModalI18n);
		this.statusEl.setText(i18n.searching);
		this.resultsEl.empty();

		if (this.multiSearchTimer !== null) {
			clearTimeout(this.multiSearchTimer);
		}
		this.multiSearchTimer = setTimeout(() => {
			this.multiSearchTimer = null;
			this.runMultiFileSearch().catch((e) => {
				console.error('[enhancement-suite] Multi-file search error:', e);
			});
		}, 500);
	}

	/** 跨文件搜索（异步）。 */
	private async runMultiFileSearch(): Promise<void> {
		const i18n = t(replaceModalI18n);

		if (!this.searchTerm) {
			this.statusEl.setText('');
			this.resultsEl.empty();
			return;
		}

		const files = this.getFilesForScope();
		if (files === null) {
			this.statusEl.setText(i18n.noActiveFolder);
			this.resultsEl.empty();
			return;
		}

		this.multiFileResults = await searchInFiles(
			this.app,
			files,
			this.searchTerm,
			this.plugin.settings.replace
		);

		this.renderMultiFileResults();
	}

	/**
	 * 根据当前 scope 返回需要搜索的文件列表。
	 * scope='folder' 时若无活跃文件则返回 null。
	 */
	private getFilesForScope(): TFile[] | null {
		const allFiles = this.app.vault.getMarkdownFiles();

		if (this.searchScope === 'vault') return allFiles;

		// scope === 'folder'
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) return null;

		const folderPath = activeFile.parent?.path ?? '/';
		return allFiles.filter((f) => f.parent?.path === folderPath);
	}

	// ---------------------------------------------------------------------------
	// 渲染结果
	// ---------------------------------------------------------------------------

	/** 渲染当前文件搜索结果（与原有逻辑一致）。 */
	private renderSingleFileResults(): void {
		const i18n = t(replaceModalI18n);
		this.resultsEl.empty();

		if (!this.searchTerm) {
			this.statusEl.setText('');
			return;
		}

		const count = this.matches.length;
		if (count === 0) {
			this.statusEl.setText(i18n.noMatchesFound);
			return;
		}

		this.statusEl.setText(i18n.matchCount(count));

		const preview = this.matches.slice(0, 50);
		for (const match of preview) {
			this.appendMatchRow(this.resultsEl, match);
		}

		if (count > 50) {
			this.resultsEl.createDiv({
				cls: 'es-replace-overflow',
				text: i18n.overflowHint(count - 50),
			});
		}
	}

	/** 渲染跨文件搜索结果（按文件分组）。 */
	private renderMultiFileResults(): void {
		const i18n = t(replaceModalI18n);
		this.resultsEl.empty();

		if (!this.searchTerm) {
			this.statusEl.setText('');
			return;
		}

		if (this.multiFileResults.length === 0) {
			this.statusEl.setText(i18n.noMatchesFound);
			return;
		}

		const totalMatches = this.multiFileResults.reduce(
			(sum, r) => sum + r.matches.length,
			0
		);
		const fileCount = this.multiFileResults.length;
		this.statusEl.setText(i18n.foundInFiles(fileCount, totalMatches));

		for (const result of this.multiFileResults) {
			// 文件组标题 + 「替换此文件」按钮
			const groupHeader = this.resultsEl.createDiv({
				cls: 'es-replace-file-header',
			});
			groupHeader.createSpan({
				cls: 'es-replace-file-name',
				text: i18n.fileGroupHeader(result.file.path, result.matches.length),
			});
			const replaceBtn = groupHeader.createEl('button', {
				cls: 'es-replace-file-btn',
				text: i18n.replaceInFileBtn,
			});
			replaceBtn.addEventListener('click', () => {
				this.replaceInFile(result.file).catch(console.error);
			});

			// 该文件的前 10 条匹配预览
			const preview = result.matches.slice(0, 10);
			for (const match of preview) {
				this.appendMatchRow(this.resultsEl, match);
			}
			if (result.matches.length > 10) {
				this.resultsEl.createDiv({
					cls: 'es-replace-overflow',
					text: i18n.overflowHint(result.matches.length - 10),
				});
			}
		}

		// 底部「全部替换」按钮
		if (this.multiFileResults.length > 0) {
			const footerEl = this.resultsEl.createDiv({ cls: 'es-replace-multi-footer' });
			const replaceAllBtn = footerEl.createEl('button', {
				cls: 'mod-cta',
				text: i18n.replaceAllFilesBtn,
			});
			replaceAllBtn.addEventListener('click', () => {
				this.replaceAllFiles().catch(console.error);
			});
		}
	}

	/** 向容器追加一条匹配结果行（行号 + 高亮文本）。 */
	private appendMatchRow(container: HTMLElement, match: SearchMatch): void {
		const row = container.createDiv({ cls: 'es-replace-result-row' });

		row.createSpan({
			cls: 'es-replace-result-line',
			text: `L${match.line + 1}`,
		});

		const before = match.lineText.slice(0, match.ch);
		const after = match.lineText.slice(match.chEnd);

		const textEl = row.createSpan({ cls: 'es-replace-result-text' });
		textEl.appendText(before);
		textEl.createSpan({ cls: 'es-replace-highlight', text: match.matchText });
		textEl.appendText(after);
	}

	// ---------------------------------------------------------------------------
	// 替换操作
	// ---------------------------------------------------------------------------

	/**
	 * 替换第一个匹配项（当前文件，scope=file）。
	 * 使用 editor.replaceRange() 以保留 Undo 历史。
	 */
	private replaceNext(): void {
		const i18n = t(replaceModalI18n);

		if (this.searchScope !== 'file') {
			// 跨文件模式下「替换」按钮无意义，提示用户使用每组的「替换此文件」
			new Notice(i18n.noMatchesReplace);
			return;
		}

		const editor = this.getEditor();
		const match = this.matches[0];
		if (!editor || !match) {
			new Notice(i18n.noMatchesReplace);
			return;
		}

		editor.replaceRange(
			this.replaceTerm,
			{ line: match.line, ch: match.ch },
			{ line: match.line, ch: match.chEnd }
		);

		this.runSearch();
		new Notice(i18n.replacedCount(1));
	}

	/**
	 * 替换所有匹配项（scope=file：editor API；scope=folder/vault：vault.modify()）。
	 */
	private replaceAll(): void {
		if (this.searchScope === 'file') {
			this.replaceAllSingleFile();
		} else {
			this.replaceAllFiles().catch(console.error);
		}
	}

	/** 当前文件全部替换（editor API，保留 Undo 历史）。 */
	private replaceAllSingleFile(): void {
		const i18n = t(replaceModalI18n);
		const editor = this.getEditor();
		if (!editor || this.matches.length === 0) {
			new Notice(i18n.noMatchesReplace);
			return;
		}

		const count = this.matches.length;

		for (let i = this.matches.length - 1; i >= 0; i--) {
			const match = this.matches[i];
			if (!match) continue;
			editor.replaceRange(
				this.replaceTerm,
				{ line: match.line, ch: match.ch },
				{ line: match.line, ch: match.chEnd }
			);
		}

		this.matches = [];
		this.renderSingleFileResults();
		new Notice(i18n.replacedCount(count));
	}

	/** 跨文件全部替换（vault.modify()，不可撤销）。 */
	private async replaceAllFiles(): Promise<void> {
		const i18n = t(replaceModalI18n);

		if (this.multiFileResults.length === 0) {
			new Notice(i18n.noMatchesReplace);
			return;
		}

		const fileCount = this.multiFileResults.length;
		const warning = i18n.replaceAllFilesWarning(fileCount);
		const common = t(commonConfirmI18n);
		const confirmed = await confirmModal(this.app, {
			title: common.confirmTitle,
			message: warning,
			confirmText: common.confirm,
			cancelText: common.cancel,
			warning: true,
		});
		if (!confirmed) return;

		let totalReplaced = 0;
		let replacedFiles = 0;

		for (const result of this.multiFileResults) {
			const count = await searchAndReplaceInFile(
				this.app,
				result.file,
				this.searchTerm,
				this.replaceTerm,
				this.plugin.settings.replace
			);
			if (count > 0) {
				totalReplaced += count;
				replacedFiles++;
			}
		}

		this.multiFileResults = [];
		this.renderMultiFileResults();
		new Notice(i18n.replacedInFiles(replacedFiles, totalReplaced));
	}

	/** 替换单个文件（跨文件模式每组的「替换此文件」按钮）。 */
	private async replaceInFile(file: TFile): Promise<void> {
		const i18n = t(replaceModalI18n);

		const count = await searchAndReplaceInFile(
			this.app,
			file,
			this.searchTerm,
			this.replaceTerm,
			this.plugin.settings.replace
		);

		// 从结果中移除已替换的文件
		this.multiFileResults = this.multiFileResults.filter(
			(r) => r.file.path !== file.path
		);
		this.renderMultiFileResults();
		new Notice(i18n.replacedCount(count));
	}
}
