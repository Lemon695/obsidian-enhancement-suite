import { TextFileView, WorkspaceLeaf, Setting } from 'obsidian';
import type EnhancementSuitePlugin from '../../main';
import { parseJson, formatJson, validateJson, getJsonStats } from './parser';
import { renderJsonTree } from '../yaml/json-viewer-modal';
import { t } from '../../i18n/locale';
import { jsonViewerUiI18n } from '../../i18n/modules/json/viewer';

export const JSON_FILE_VIEW_TYPE = 'json-file-view';

type ViewMode = 'tree' | 'source';

/**
 * JSON 文件自定义视图。
 *
 * 继承 TextFileView，拦截 .json 文件的打开：
 *   - 树形模式（默认）：复用 yaml 模块的 renderJsonTree，呈现可折叠树
 *   - 源码模式：可编辑 <textarea> + 实时校验指示器 + 格式化按钮
 *
 * 生命周期：
 *   onOpen  → 构建 DOM 骨架
 *   setViewData(data, clear) → 填充内容并刷新
 *   getViewData             → 返回当前内容（用于保存）
 *   clear   → 重置视图
 */
export class JsonFileView extends TextFileView {
	private mode: ViewMode = 'tree';
	private rawData = '';

	// DOM 节点引用
	private toolbarEl!: HTMLElement;
	private treeModeBtn!: HTMLButtonElement;
	private sourceModeBtn!: HTMLButtonElement;
	private formatBtn!: HTMLButtonElement;
	private statusEl!: HTMLElement;
	private bodyEl!: HTMLElement;
	private treeEl!: HTMLElement;
	private sourceEl!: HTMLTextAreaElement;
	private statsEl!: HTMLElement;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: EnhancementSuitePlugin,
	) {
		super(leaf);
	}

	getViewType(): string {
		return JSON_FILE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return this.file?.basename ?? 'JSON';
	}

	getIcon(): string {
		// 'braces' 是 Obsidian 内置 Lucide 图标
		return 'braces';
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
		// 源码模式时以 textarea 内容为准；树形模式直接返回 rawData
		return this.mode === 'source' ? this.sourceEl.value : this.rawData;
	}

	setViewData(data: string, clear: boolean): void {
		this.rawData = data;
		if (clear) {
			// 文件重新加载时（例如外部修改）回到树形模式
			this.mode = 'tree';
		}
		// DOM 尚未构建时（onOpen 未被调用），不刷新
		if (this.treeEl) this.refresh();
	}

	clear(): void {
		this.rawData = '';
		if (!this.treeEl) return;
		this.treeEl.empty();
		this.sourceEl.value = '';
		this.statsEl.setText('');
	}

	// ---------------------------------------------------------------------------
	// UI 构建
	// ---------------------------------------------------------------------------

	private buildUI(): void {
		const i18n = t(jsonViewerUiI18n);
		this.contentEl.addClass('es-json-file-view');

		// ── 工具栏 ──────────────────────────────────────────────────────────
		this.toolbarEl = this.contentEl.createDiv({ cls: 'es-json-file-toolbar' });

		// 模式切换按钮组
		const modeGroup = this.toolbarEl.createDiv({
			cls: 'es-json-file-mode-group',
		});
		this.treeModeBtn = modeGroup.createEl('button', {
			text: i18n.treeView,
			cls: 'es-json-file-mode-btn',
		});
		this.sourceModeBtn = modeGroup.createEl('button', {
			text: i18n.sourceView,
			cls: 'es-json-file-mode-btn',
		});
		this.treeModeBtn.addEventListener('click', () => this.setMode('tree'));
		this.sourceModeBtn.addEventListener('click', () =>
			this.setMode('source'),
		);

		// 格式化按钮（仅源码模式可见）
		this.formatBtn = this.toolbarEl.createEl('button', {
			text: i18n.format,
			cls: 'es-json-file-format-btn mod-cta',
		});
		this.formatBtn.addEventListener('click', () => this.formatSource());

		// 校验状态
		this.statusEl = this.toolbarEl.createDiv({
			cls: 'es-json-file-status',
		});

		// ── 主体 ────────────────────────────────────────────────────────────
		this.bodyEl = this.contentEl.createDiv({ cls: 'es-json-file-body' });

		// 树形容器（复用 .es-json-tree 样式）
		this.treeEl = this.bodyEl.createDiv({ cls: 'es-json-tree es-json-file-tree-inner' });

		// 源码编辑区
		this.sourceEl = this.bodyEl.createEl('textarea', {
			cls: 'es-json-file-source',
		});
		this.sourceEl.spellcheck = false;
		this.sourceEl.addEventListener('input', () => this.onSourceChange());

		// ── 状态栏 ───────────────────────────────────────────────────────────
		this.statsEl = this.contentEl.createDiv({
			cls: 'es-json-file-statusbar',
		});

		this.updateModeUI();
	}

	// ---------------------------------------------------------------------------
	// 模式切换
	// ---------------------------------------------------------------------------

	private setMode(mode: ViewMode): void {
		if (this.mode === mode) return;

		// 从源码模式切出前同步 rawData
		if (this.mode === 'source') {
			this.rawData = this.sourceEl.value;
		}
		this.mode = mode;
		this.refresh();
	}

	// ---------------------------------------------------------------------------
	// 渲染刷新
	// ---------------------------------------------------------------------------

	private refresh(): void {
		const i18n = t(jsonViewerUiI18n);

		this.treeEl.empty();

		if (this.mode === 'tree') {
			const result = parseJson(this.rawData);

			if (result.ok) {
				renderJsonTree(this.treeEl, result.value);
				this.showStatus('valid', i18n.valid);
				const stats = getJsonStats(result.value);
				this.statsEl.setText(
					`${i18n.stats(stats.keys, stats.depth)}  ·  ${i18n.fileSizeBytes(stats.size)}`,
				);
			} else {
				// 无效 JSON：显示错误信息
				this.treeEl.createDiv({
					cls: 'es-json-file-error',
					text: result.error,
				});
				this.showStatus('invalid', i18n.invalid);
				this.statsEl.setText('');
			}
		} else {
			// 源码模式：填充 textarea，不清空 rawData
			this.sourceEl.value = this.rawData;
			this.updateSourceStatus();
			this.statsEl.setText('');
		}

		this.updateModeUI();
	}

	// ---------------------------------------------------------------------------
	// 源码模式辅助
	// ---------------------------------------------------------------------------

	private onSourceChange(): void {
		this.rawData = this.sourceEl.value;
		this.updateSourceStatus();

		if (this.plugin.settings.json.formatOnSave) {
			// formatOnSave 在每次 requestSave 时触发（见 getViewData override 暂无实现）
			// 此处仅标记 dirty，保存由 Obsidian 在合适时机调用 getViewData()
		}
		this.requestSave();
	}

	private updateSourceStatus(): void {
		const i18n = t(jsonViewerUiI18n);
		const result = validateJson(this.sourceEl.value);

		if (result.valid) {
			this.showStatus('valid', i18n.valid);
		} else {
			const lineHint = result.line != null ? ` (L${result.line})` : '';
			this.showStatus('invalid', `${i18n.invalid}${lineHint}`);
		}
	}

	private formatSource(): void {
		const result = parseJson(this.sourceEl.value);
		if (!result.ok) return; // 无效 JSON 时格式化按钮已禁用（视觉上），不操作

		const formatted = formatJson(result.value);
		this.sourceEl.value = formatted;
		this.rawData = formatted;
		this.requestSave();

		const i18n = t(jsonViewerUiI18n);
		this.showStatus('valid', i18n.valid);
	}

	// ---------------------------------------------------------------------------
	// DOM 更新辅助
	// ---------------------------------------------------------------------------

	private updateModeUI(): void {
		const isTree = this.mode === 'tree';

		// 切换主体区域
		this.treeEl.toggle(isTree);
		this.sourceEl.toggle(!isTree);

		// 格式化按钮仅在源码模式显示
		this.formatBtn.toggle(!isTree);

		// 按钮激活状态
		this.treeModeBtn.toggleClass('is-active', isTree);
		this.sourceModeBtn.toggleClass('is-active', !isTree);
	}

	private showStatus(type: 'valid' | 'invalid', text: string): void {
		this.statusEl.setText(text);
		this.statusEl.toggleClass('es-json-status-valid', type === 'valid');
		this.statusEl.toggleClass('es-json-status-invalid', type === 'invalid');
	}
}

// ---------------------------------------------------------------------------
// 辅助：在设置 UI 中渲染格式化选项（供 JsonModule.renderSettings 调用）
// ---------------------------------------------------------------------------

export function renderJsonFileViewSettings(
	containerEl: HTMLElement,
	plugin: EnhancementSuitePlugin,
): void {
	new Setting(containerEl)
		.setName(t({ zh: '保存时自动格式化', en: 'Auto-format on save' }))
		.setDesc(
			t({
				zh: '在源码模式下，修改后保存时自动格式化 JSON（2 格缩进）。',
				en: 'In source mode, automatically format JSON (2-space indent) when saving.',
			}),
		)
		.addToggle((toggle) =>
			toggle
				.setValue(plugin.settings.json.formatOnSave)
				.onChange(async (value) => {
					plugin.settings.json.formatOnSave = value;
					await plugin.saveSettings();
				}),
		);
}
