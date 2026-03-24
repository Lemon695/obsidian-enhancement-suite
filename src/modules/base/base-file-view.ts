import { TextFileView, WorkspaceLeaf, Platform } from 'obsidian';
import type EnhancementSuitePlugin from '../../main';
import { parseBase, formatBase, validateBase, getBaseStats } from './parser';
import { renderJsonTree } from '../yaml/json-viewer-modal';
import { t } from '../../i18n/locale';
import { baseViewerUiI18n } from '../../i18n/modules/base/viewer';

export const BASE_FILE_VIEW_TYPE = 'base-file-view';

type ViewMode = 'tree' | 'source';

/**
 * .base 文件自定义视图。
 *
 * 继承 TextFileView，拦截 .base 文件的打开：
 *   - 树形模式（默认）：复用 yaml 模块的 renderJsonTree，呈现可折叠树
 *   - 源码模式：可编辑 <textarea> + 实时校验指示器 + 格式化按钮
 *              + 内联搜索/替换栏（Cmd/Ctrl+F 或 Cmd/Ctrl+H 触发）
 *
 * 生命周期：
 *   onOpen  → 构建 DOM 骨架
 *   setViewData(data, clear) → 填充内容并刷新
 *   getViewData             → 返回当前内容（用于保存）
 *   clear   → 重置视图
 */
export class BaseFileView extends TextFileView {
	private mode: ViewMode = 'tree';
	private rawData = '';

	// 工具栏 DOM
	private toolbarEl!: HTMLElement;
	private treeModeBtn!: HTMLButtonElement;
	private sourceModeBtn!: HTMLButtonElement;
	private formatBtn!: HTMLButtonElement;
	private statusEl!: HTMLElement;

	// 主内容区 DOM
	private bodyEl!: HTMLElement;
	private treeEl!: HTMLElement;
	private sourceEl!: HTMLTextAreaElement;

	// 状态栏 DOM
	private statsEl!: HTMLElement;

	// 搜索/替换栏 DOM
	private searchBarEl!: HTMLElement;
	private searchInput!: HTMLInputElement;
	private replaceInput!: HTMLInputElement;
	private matchCountEl!: HTMLElement;
	private prevBtn!: HTMLButtonElement;
	private nextBtn!: HTMLButtonElement;
	private replaceOneBtn!: HTMLButtonElement;
	private replaceAllBtn!: HTMLButtonElement;

	// 源码模式搜索状态
	private searchMatches: { start: number; end: number }[] = [];
	private currentMatchIndex = -1;

	// 树形模式搜索状态
	private treeSearchMatches: HTMLElement[] = [];
	private treeCurrentMatchIndex = -1;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: EnhancementSuitePlugin,
	) {
		super(leaf);
	}

	getViewType(): string {
		return BASE_FILE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return this.file?.basename ?? 'Base';
	}

	getIcon(): string {
		return 'database';
	}

	async onOpen(): Promise<void> {
		this.buildUI();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	// ---------------------------------------------------------------------------
	// TextFileView 抽象方法
	// ---------------------------------------------------------------------------
	getViewData(): string {
		const raw = this.mode === 'source' ? this.sourceEl.value : this.rawData;
		if (this.mode === 'source' && this.plugin.settings.base.formatOnSave) {
			const result = parseBase(raw);
			if (result.ok) return formatBase(result.value);
		}
		return raw;
	}

	setViewData(data: string, clear: boolean): void {
		this.rawData = data;
		if (clear) {
			this.mode = 'tree';
		}
		this.refresh();
	}

	clear(): void {
		this.rawData = '';
		this.mode = 'tree';
		if (this.treeEl) this.treeEl.empty();
		if (this.sourceEl) this.sourceEl.value = '';
		if (this.statsEl) this.statsEl.setText('');
		this.hideSearchBar();
	}

	// ---------------------------------------------------------------------------
	// UI 构建
	// ---------------------------------------------------------------------------

	private buildUI(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('es-base-file-view');

		// 工具栏
		this.toolbarEl = contentEl.createDiv({ cls: 'es-base-file-toolbar' });
		const modeGroup = this.toolbarEl.createDiv({ cls: 'es-base-file-mode-group' });
		this.treeModeBtn = modeGroup.createEl('button', { cls: 'es-base-file-mode-btn' });
		this.sourceModeBtn = modeGroup.createEl('button', { cls: 'es-base-file-mode-btn' });
		this.formatBtn = this.toolbarEl.createEl('button', { cls: 'es-base-file-format-btn mod-cta' });
		this.statusEl = this.toolbarEl.createDiv({ cls: 'es-base-file-status' });

		// 搜索/替换栏（默认隐藏）
		this.searchBarEl = contentEl.createDiv({ cls: 'es-base-search-bar es-base-search-bar--hidden' });
		this.buildSearchBar();

		// 主内容区
		this.bodyEl = contentEl.createDiv({ cls: 'es-base-file-body' });
		this.treeEl = this.bodyEl.createDiv({ cls: 'es-json-tree es-base-file-tree-inner' });
		this.treeEl.setAttribute('tabindex', '0');
		this.sourceEl = this.bodyEl.createEl('textarea', { cls: 'es-base-file-source' });

		// 状态栏
		this.statsEl = contentEl.createDiv({ cls: 'es-base-file-statusbar' });

		this.bindEvents();
		this.updateLabels();
		this.updateModeUI();
	}

	private buildSearchBar(): void {
		// 第一行：搜索输入 + 导航按钮 + 计数 + 关闭
		const row1 = this.searchBarEl.createDiv({ cls: 'es-base-search-row' });
		this.searchInput = row1.createEl('input', { cls: 'es-base-search-input' });
		this.searchInput.type = 'text';
		this.prevBtn = row1.createEl('button', { cls: 'es-base-search-btn' });
		this.nextBtn = row1.createEl('button', { cls: 'es-base-search-btn' });
		this.matchCountEl = row1.createDiv({ cls: 'es-base-search-count' });
		const closeBtn = row1.createEl('button', { cls: 'es-base-search-close' });
		closeBtn.setText('✕');
		closeBtn.addEventListener('click', () => this.hideSearchBar());
		// 第二行：替换输入 + 替换按钮
		const row2 = this.searchBarEl.createDiv({ cls: 'es-base-search-row' });
		this.replaceInput = row2.createEl('input', { cls: 'es-base-search-input' });
		this.replaceInput.type = 'text';
		this.replaceOneBtn = row2.createEl('button', { cls: 'es-base-search-btn' });
		this.replaceAllBtn = row2.createEl('button', { cls: 'es-base-search-btn' });
	}

	private updateLabels(): void {
		const i18n = t(baseViewerUiI18n);
		this.treeModeBtn.setText(i18n.treeView);
		this.sourceModeBtn.setText(i18n.sourceView);
		this.formatBtn.setText(i18n.format);
		this.searchInput.placeholder = i18n.searchPlaceholder;
		this.replaceInput.placeholder = i18n.replacePlaceholder;
		this.prevBtn.setText(i18n.prevMatch);
		this.nextBtn.setText(i18n.nextMatch);
		this.replaceOneBtn.setText(i18n.replaceOne);
		this.replaceAllBtn.setText(i18n.replaceAll);
	}

	private bindEvents(): void {
		this.treeModeBtn.addEventListener('click', () => this.setMode('tree'));
		this.sourceModeBtn.addEventListener('click', () => this.setMode('source'));
		this.formatBtn.addEventListener('click', () => this.formatSource());

		// 源码模式：实时校验 + 标记文件已修改
		this.sourceEl.addEventListener('input', () => {
			this.validateAndShowStatus(this.sourceEl.value);
			this.requestSave();
			// 搜索栏打开时实时更新匹配
			if (!this.searchBarEl.hasClass('es-base-search-bar--hidden')) {
				this.runSearch();
			}
		});

		// 键盘快捷键：在 window 层捕获（capture phase），比 Obsidian 注册在 document 上的
		// 全局 Cmd+F 热键处理器更早触发，从而阻止 Obsidian 打开自己的搜索界面。
		// 仅当本视图是当前活跃叶子时响应，无需依赖 activeElement 焦点检测。
		this.registerDomEvent(
			window,
			'keydown',
			(e: KeyboardEvent) => {
				if (this.app.workspace.getActiveViewOfType(BaseFileView) !== this) return;
				this.handleKeydown(e);
			},
			true, // capture phase
		);

		// 搜索栏事件
		this.searchInput.addEventListener('input', () => this.runSearch());
		this.searchInput.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				this.hideSearchBar();
			}
		});
		this.replaceInput.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				this.hideSearchBar();
			}
		});
		this.prevBtn.addEventListener('click', () => this.prevMatch());
		this.nextBtn.addEventListener('click', () => this.nextMatch());
		this.replaceOneBtn.addEventListener('click', () => this.replaceCurrent());
		this.replaceAllBtn.addEventListener('click', () => this.replaceAll());
	}

	// ---------------------------------------------------------------------------
	// 键盘快捷键处理
	// ---------------------------------------------------------------------------
	private handleKeydown(e: KeyboardEvent): void {
		const isMac = Platform.isMacOS;
		const ctrl = isMac ? e.metaKey : e.ctrlKey;
		if (!ctrl) return;

		if (e.key === 'f' || e.key === 'F') {
			// Cmd/Ctrl+F: 打开搜索（树形模式 + 源码模式均支持）
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			this.showSearchBar(false);
		} else if (e.key === 'h' || e.key === 'H') {
			// Cmd/Ctrl+H: 打开搜索+替换（仅源码模式）
			if (this.mode !== 'source') return;
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			this.showSearchBar(true);
		}
	}

	// ---------------------------------------------------------------------------
	// 搜索/替换栏显示控制
	// ---------------------------------------------------------------------------
	private showSearchBar(withReplace: boolean): void {
		this.searchBarEl.removeClass('es-base-search-bar--hidden');
		// 替换行仅在源码模式下显示
		const replaceRow = this.searchBarEl.querySelectorAll('.es-base-search-row')[1] as HTMLElement | undefined;
		if (replaceRow) {
			replaceRow.style.display = (withReplace && this.mode === 'source') ? '' : 'none';
		}
		this.searchInput.focus();
		this.searchInput.select();
		this.runSearch();
	}

	private hideSearchBar(): void {
		this.searchBarEl.addClass('es-base-search-bar--hidden');
		this.searchMatches = [];
		this.currentMatchIndex = -1;
		this.clearHighlights();
		this.clearTreeHighlights();
		this.treeSearchMatches = [];
		this.treeCurrentMatchIndex = -1;
		if (this.mode === 'source') {
			this.sourceEl.focus();
		}
	}

	// ---------------------------------------------------------------------------
	// 搜索逻辑
	// ---------------------------------------------------------------------------
	private runSearch(): void {
		if (this.mode === 'tree') {
			this.runTreeSearch();
		} else {
			this.runSourceSearch();
		}
	}

	private runSourceSearch(): void {
		const needle = this.searchInput.value;
		this.searchMatches = [];
		this.currentMatchIndex = -1;

		if (!needle) {
			this.updateMatchCount();
			this.clearHighlights();
			return;
		}

		const text = this.sourceEl.value;
		const lower = text.toLowerCase();
		const lowerNeedle = needle.toLowerCase();
		let pos = 0;
		while (true) {
			const idx = lower.indexOf(lowerNeedle, pos);
			if (idx === -1) break;
			this.searchMatches.push({ start: idx, end: idx + needle.length });
			pos = idx + 1;
		}

		if (this.searchMatches.length > 0) {
			const cursor = this.sourceEl.selectionStart ?? 0;
			let best = 0;
			for (let i = 0; i < this.searchMatches.length; i++) {
				const m = this.searchMatches[i];
				if (m && m.start >= cursor) { best = i; break; }
				best = i;
			}
			this.currentMatchIndex = best;
			this.scrollToMatch(this.currentMatchIndex);
		}
		this.updateMatchCount();
	}

	private nextMatch(): void {
		if (this.mode === 'tree') {
			if (this.treeSearchMatches.length === 0) return;
			this.treeCurrentMatchIndex =
				(this.treeCurrentMatchIndex + 1) % this.treeSearchMatches.length;
			this.scrollToTreeMatch(this.treeCurrentMatchIndex);
		} else {
			if (this.searchMatches.length === 0) return;
			this.currentMatchIndex =
				(this.currentMatchIndex + 1) % this.searchMatches.length;
			this.scrollToMatch(this.currentMatchIndex);
		}
		this.updateMatchCount();
	}

	private prevMatch(): void {
		if (this.mode === 'tree') {
			if (this.treeSearchMatches.length === 0) return;
			this.treeCurrentMatchIndex =
				(this.treeCurrentMatchIndex - 1 + this.treeSearchMatches.length) % this.treeSearchMatches.length;
			this.scrollToTreeMatch(this.treeCurrentMatchIndex);
		} else {
			if (this.searchMatches.length === 0) return;
			this.currentMatchIndex =
				(this.currentMatchIndex - 1 + this.searchMatches.length) % this.searchMatches.length;
			this.scrollToMatch(this.currentMatchIndex);
		}
		this.updateMatchCount();
	}

	private scrollToMatch(index: number): void {
		const match = this.searchMatches[index];
		if (!match) return;
		this.sourceEl.focus();
		this.sourceEl.setSelectionRange(match.start, match.end);
		// 滚动 textarea 使选中内容可见
		const lineHeight = parseInt(getComputedStyle(this.sourceEl).lineHeight) || 20;
		const text = this.sourceEl.value.substring(0, match.start);
		const linesBefore = (text.match(/\n/g) ?? []).length;
		this.sourceEl.scrollTop = Math.max(0, (linesBefore - 3) * lineHeight);
	}

	private updateMatchCount(): void {
		const i18n = t(baseViewerUiI18n);
		const needle = this.searchInput.value;
		const total = this.mode === 'tree' ? this.treeSearchMatches.length : this.searchMatches.length;
		const current = this.mode === 'tree' ? this.treeCurrentMatchIndex : this.currentMatchIndex;
		if (total === 0) {
			this.matchCountEl.setText(needle ? i18n.noMatches : '');
			this.matchCountEl.toggleClass('es-base-search-no-match', needle.length > 0);
		} else {
			this.matchCountEl.setText(i18n.matchCount(current + 1, total));
			this.matchCountEl.removeClass('es-base-search-no-match');
		}
	}

	/** textarea 不支持原生高亮，选中当前匹配即可（无需额外处理）。 */
	private clearHighlights(): void {
		const pos = this.sourceEl.selectionStart ?? 0;
		this.sourceEl.setSelectionRange(pos, pos);
	}

	// ---------------------------------------------------------------------------
	// 树形模式搜索
	// ---------------------------------------------------------------------------

	/**
	 * 遍历 treeEl 内所有文本节点，将匹配片段用 <mark> 包裹，
	 * 收集所有 mark 元素到 treeSearchMatches。
	 */
	private runTreeSearch(): void {
		this.clearTreeHighlights();
		this.treeSearchMatches = [];
		this.treeCurrentMatchIndex = -1;

		const needle = this.searchInput.value;
		if (!needle) {
			this.updateMatchCount();
			return;
		}

		const lowerNeedle = needle.toLowerCase();

		// 收集所有文本节点（深度优先）
		const textNodes: Text[] = [];
		const walker = document.createTreeWalker(this.treeEl, NodeFilter.SHOW_TEXT);
		let node: Node | null;
		while ((node = walker.nextNode())) {
			textNodes.push(node as Text);
		}

		for (const textNode of textNodes) {
			const text = textNode.textContent ?? '';
			const lower = text.toLowerCase();
			let pos = 0;
			const parts: (string | HTMLElement)[] = [];
			let hasMatch = false;

			while (true) {
				const idx = lower.indexOf(lowerNeedle, pos);
				if (idx === -1) {
					parts.push(text.substring(pos));
					break;
				}
				hasMatch = true;
				parts.push(text.substring(pos, idx));
				const mark = document.createElement('mark');
				mark.className = 'es-base-tree-highlight';
				mark.textContent = text.substring(idx, idx + needle.length);
				parts.push(mark);
				pos = idx + needle.length;
			}

			if (!hasMatch) continue;

			// 用 fragment 替换原文本节点
			const parent = textNode.parentNode;
			if (!parent) continue;
			const frag = document.createDocumentFragment();
			for (const part of parts) {
				if (typeof part === 'string') {
					frag.appendChild(document.createTextNode(part));
				} else {
					frag.appendChild(part);
					this.treeSearchMatches.push(part);
				}
			}
			parent.replaceChild(frag, textNode);
		}

		if (this.treeSearchMatches.length > 0) {
			this.treeCurrentMatchIndex = 0;
			this.scrollToTreeMatch(0);
		}
		this.updateMatchCount();
	}

	/** 移除所有 <mark> 节点，还原文本内容。 */
	private clearTreeHighlights(): void {
		const marks = Array.from(this.treeEl.querySelectorAll('mark.es-base-tree-highlight'));
		for (const mark of marks) {
			const parent = mark.parentNode;
			if (!parent) continue;
			parent.replaceChild(document.createTextNode(mark.textContent ?? ''), mark);
			parent.normalize();
		}
	}

	/** 滚动并高亮树形模式当前匹配项。 */
	private scrollToTreeMatch(index: number): void {
		// 清除所有当前高亮
		for (const m of this.treeSearchMatches) {
			m.removeClass('es-base-tree-highlight--current');
		}
		const el = this.treeSearchMatches[index];
		if (!el) return;
		el.addClass('es-base-tree-highlight--current');
		el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}

	// ---------------------------------------------------------------------------
	// 替换逻辑
	// ---------------------------------------------------------------------------
	private replaceCurrent(): void {
		if (this.currentMatchIndex < 0 || this.searchMatches.length === 0) return;
		const match = this.searchMatches[this.currentMatchIndex];
		if (!match) return;
		const replacement = this.replaceInput.value;
		const text = this.sourceEl.value;
		this.sourceEl.value =
			text.substring(0, match.start) + replacement + text.substring(match.end);
		this.rawData = this.sourceEl.value;
		this.validateAndShowStatus(this.rawData);
		this.requestSave();
		this.runSearch();
	}

	private replaceAll(): void {
		const needle = this.searchInput.value;
		if (!needle || this.searchMatches.length === 0) return;
		const replacement = this.replaceInput.value;
		const i18n = t(baseViewerUiI18n);
		const count = this.searchMatches.length;
		// 大小写不敏感替换
		const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		this.sourceEl.value = this.sourceEl.value.replace(
			new RegExp(escaped, 'gi'),
			replacement,
		);
		this.rawData = this.sourceEl.value;
		this.validateAndShowStatus(this.rawData);
		this.requestSave();
		this.runSearch();
		this.matchCountEl.setText(i18n.replacedCount(count));
	}

	// ---------------------------------------------------------------------------
	// 模式切换
	// ---------------------------------------------------------------------------
	private setMode(mode: ViewMode): void {
		if (this.mode === mode) return;
		if (this.mode === 'source') {
			this.rawData = this.sourceEl.value;
		}
		this.mode = mode;
		this.refresh();
		// 搜索栏打开时：切换模式后重新执行搜索（树形 / 源码均支持）
		if (!this.searchBarEl.hasClass('es-base-search-bar--hidden')) {
			this.runSearch();
		}
	}

	private updateModeUI(): void {
		const isSource = this.mode === 'source';
		this.treeModeBtn.toggleClass('is-active', !isSource);
		this.sourceModeBtn.toggleClass('is-active', isSource);
		this.formatBtn.style.display = isSource ? '' : 'none';
		this.treeEl.style.display = isSource ? 'none' : '';
		this.sourceEl.style.display = isSource ? '' : 'none';
		// 替换行仅在源码模式下才有意义，切换到树形时隐藏替换行（但保留搜索栏）
		const replaceRow = this.searchBarEl.querySelectorAll('.es-base-search-row')[1] as HTMLElement | undefined;
		if (replaceRow && !isSource) {
			replaceRow.style.display = 'none';
		}
	}

	// ---------------------------------------------------------------------------
	// 渲染刷新
	// ---------------------------------------------------------------------------

	private refresh(): void {
		this.updateModeUI();
		if (this.mode === 'tree') {
			this.renderTree();
		} else {
			this.sourceEl.value = this.rawData;
			this.validateAndShowStatus(this.rawData);
		}
		this.updateStats();
	}

	private renderTree(): void {
		this.treeEl.empty();
		const result = parseBase(this.rawData);
		if (!result.ok) {
			this.treeEl.createDiv({
				cls: 'es-base-file-error',
				text: result.error,
			});
			this.showStatus('invalid', t(baseViewerUiI18n).invalid);
			return;
		}
		renderJsonTree(this.treeEl, result.value);
		this.showStatus('valid', t(baseViewerUiI18n).valid);
	}

	private validateAndShowStatus(content: string): void {
		const vr = validateBase(content);
		const i18n = t(baseViewerUiI18n);
		if (vr.valid) {
			this.showStatus('valid', i18n.valid);
		} else {
			const label = vr.error ? `${i18n.invalid} (${vr.error})` : i18n.invalid;
			this.showStatus('invalid', label);
		}
	}

	private updateStats(): void {
		const result = parseBase(this.rawData);
		const i18n = t(baseViewerUiI18n);
		if (!result.ok) {
			this.statsEl.setText('');
			return;
		}
		const stats = getBaseStats(result.value, this.rawData);
		const sizeStr = i18n.fileSizeBytes(stats.size);
		this.statsEl.setText(
			`${i18n.stats(stats.viewCount, stats.depth)}  ·  ${sizeStr}`,
		);
	}

	// ---------------------------------------------------------------------------
	// 格式化
	// ---------------------------------------------------------------------------

	private formatSource(): void {
		const result = parseBase(this.sourceEl.value);
		if (!result.ok) return;
		this.sourceEl.value = formatBase(result.value);
		this.rawData = this.sourceEl.value;
		this.validateAndShowStatus(this.rawData);
		this.updateStats();
		this.requestSave();
	}

	private showStatus(type: 'valid' | 'invalid', text: string): void {
		this.statusEl.setText(text);
		this.statusEl.toggleClass('es-base-status-valid', type === 'valid');
		this.statusEl.toggleClass('es-base-status-invalid', type === 'invalid');
	}
}
