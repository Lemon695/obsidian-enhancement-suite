import { App, Editor, MarkdownView, Modal, Notice, Setting } from 'obsidian';
import type EnhancementSuitePlugin from '../../main';
import {
	SearchMatch,
	searchInContent,
	applyReplacement,
} from './searcher';
import { t } from '../../i18n/locale';
import { replaceModalI18n } from '../../i18n/modules/replace/modal';

/**
 * 搜索替换对话框。
 *
 * 功能：
 *   - 在当前活跃笔记中搜索关键词
 *   - 支持大小写敏感和正则表达式
 *   - 显示匹配结果预览列表（最多 50 条）
 *   - 逐条替换（Replace）或一键全部替换（Replace All）
 *   - 大小写/正则选项与 ReplaceModuleSettings 双向同步
 */
export class ReplaceModal extends Modal {
	private searchTerm = '';
	private replaceTerm = '';
	private matches: SearchMatch[] = [];

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
				// 自动聚焦
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
		this.contentEl.empty();
	}

	// ---------------------------------------------------------------------------
	// 私有方法
	// ---------------------------------------------------------------------------

	/** 获取当前活跃 MarkdownView 的 Editor，不存在则返回 null。 */
	private getEditor(): Editor | null {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		return view ? view.editor : null;
	}

	/** 执行搜索并刷新结果列表。 */
	private runSearch(): void {
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

		this.renderResults();
	}

	/** 渲染搜索结果预览列表。 */
	private renderResults(): void {
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

		// 最多显示 50 条预览
		const preview = this.matches.slice(0, 50);
		for (const match of preview) {
			const row = this.resultsEl.createDiv({ cls: 'es-replace-result-row' });

			row.createSpan({
				cls: 'es-replace-result-line',
				text: `L${match.line + 1}`,
			});

			// 将匹配内容高亮显示
			const before = match.lineText.slice(0, match.ch);
			const highlight = match.matchText;
			const after = match.lineText.slice(match.chEnd);

			const textEl = row.createSpan({ cls: 'es-replace-result-text' });
			textEl.appendText(before);
			textEl.createSpan({ cls: 'es-replace-highlight', text: highlight });
			textEl.appendText(after);
		}

		if (count > 50) {
			this.resultsEl.createDiv({
				cls: 'es-replace-overflow',
				text: i18n.overflowHint(count - 50),
			});
		}
	}

	/**
	 * 替换第一个匹配项，然后重新搜索。
	 * 使用 editor.replaceRange() 以保留 Undo 历史。
	 */
	private replaceNext(): void {
		const i18n = t(replaceModalI18n);
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
	 * 替换所有匹配项。
	 * 从后向前调用 editor.replaceRange() 以保证偏移量不失效。
	 */
	private replaceAll(): void {
		const i18n = t(replaceModalI18n);
		const editor = this.getEditor();
		if (!editor || this.matches.length === 0) {
			new Notice(i18n.noMatchesReplace);
			return;
		}

		const count = this.matches.length;

		// 从后向前替换，避免偏移量漂移
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
		this.renderResults();
		new Notice(i18n.replacedCount(count));
	}
}
