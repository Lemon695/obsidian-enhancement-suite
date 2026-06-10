import { MarkdownView, Setting, WorkspaceLeaf } from 'obsidian';
import type { PluginModule } from '../../core/types';
import type EnhancementSuitePlugin from '../../main';
import { t } from '../../i18n/locale';
import { progressModuleI18n } from '../../i18n/modules/progress/module';
import { progressSettingsI18n } from '../../i18n/modules/progress/settings';

/** 单个叶子注入的进度条数据（用于清理）。 */
interface BarEntry {
	barEl: HTMLElement;
	handler: () => void;
	scrollEl: HTMLElement;
	/** 本模块是否为该滚动容器添加了 es-progress-host 定位类（清理时需移除）。 */
	addedHostClass: boolean;
}

interface ProgressBarState {
	width: string;
	transform: string;
}

/**
 * 根据滚动容器当前状态计算进度条样式。
 *
 * 说明：
 * - width 反映阅读进度百分比
 * - transform 将进度条平移到当前可视区域顶部，避免其被正文顶部 padding 压下去
 */
export function calculateProgressBarState(
	scrollTop: number,
	scrollHeight: number,
	clientHeight: number
): ProgressBarState {
	const safeScrollTop = Math.max(scrollTop, 0);
	const maxScroll = Math.max(scrollHeight - clientHeight, 0);
	const progress = maxScroll > 0
		? Math.min(safeScrollTop / maxScroll, 1)
		: 0;

	return {
		width: `${(progress * 100).toFixed(1)}%`,
		transform: `translateY(${safeScrollTop}px)`,
	};
}

/**
 * Reading Progress Module — 阅读进度条模块
 *
 * 功能：
 *   - 在阅读模式顶部注入一条细进度条
 *   - 随用户滚动实时更新进度（宽度 0% → 100%）
 *   - 进度条高度与颜色可在设置中自定义
 *
 * 设计说明：
 *   - 进度条注入到 .markdown-preview-view 内的第一个子元素之前
 *     采用 absolute + transform 跟随滚动，使其贴在阅读视口顶端
 *   - 用 Map<WorkspaceLeaf, BarEntry> 记录每个叶子的进度条与监听器，
 *     onunload() 时统一清理
 *   - layout-change / active-leaf-change 事件触发 syncBars()：
 *       * 为新出现的预览叶子注入进度条
 *       * 移除已关闭或切换为编辑模式的叶子的进度条
 *
 * 设置存储路径：plugin.settings.progress
 */
export class ProgressModule implements PluginModule {
	readonly id = 'progress';
	readonly name = t(progressModuleI18n).name;
	readonly description = t(progressModuleI18n).description;

	/** leaf → 进度条数据，用于清理。 */
	private readonly barMap = new Map<WorkspaceLeaf, BarEntry>();

	constructor(private readonly plugin: EnhancementSuitePlugin) {}

	onload(): void {
		this.plugin.registerEvent(
			this.plugin.app.workspace.on('layout-change', () => this.syncBars())
		);
		this.plugin.registerEvent(
			this.plugin.app.workspace.on('active-leaf-change', () => this.syncBars())
		);

		// 插件加载时立即尝试注入
		this.syncBars();
	}

	onunload(): void {
		// 移除所有注入的进度条和 scroll 监听器
		for (const entry of this.barMap.values()) {
			this.cleanupBar(entry);
		}
		this.barMap.clear();
	}

	renderSettings(containerEl: HTMLElement): void {
		const i18n = t(progressSettingsI18n);

		new Setting(containerEl)
			.setName(i18n.barHeight.name)
			.setDesc(i18n.barHeight.desc)
			.addText((text) =>
				text
					.setValue(String(this.plugin.settings.progress.barHeightPx))
					.onChange(async (value) => {
						const n = parseInt(value, 10);
						if (n > 0) {
							this.plugin.settings.progress.barHeightPx = n;
							await this.plugin.saveSettings();
							this.updateAllBarStyles();
						}
					})
			);

		new Setting(containerEl)
			.setName(i18n.barColor.name)
			.setDesc(i18n.barColor.desc)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.progress.barColor)
					.onChange(async (value) => {
						this.plugin.settings.progress.barColor = value;
						await this.plugin.saveSettings();
						this.updateAllBarStyles();
					})
			);
	}

	// ---------------------------------------------------------------------------
	// 私有方法
	// ---------------------------------------------------------------------------

	/**
	 * 同步所有预览叶子的进度条：
	 *   - 为新出现的预览叶子注入进度条
	 *   - 清理已不再处于预览模式（或已关闭）的叶子
	 */
	private syncBars(): void {
		const activePrevLeaves = new Set<WorkspaceLeaf>();

		this.plugin.app.workspace.iterateAllLeaves((leaf) => {
			const view = leaf.view;
			if (!(view instanceof MarkdownView)) return;

			const state = view.getState() as unknown as { mode?: string };
			if (state.mode !== 'preview') return;

			activePrevLeaves.add(leaf);

			if (!this.barMap.has(leaf)) {
				this.injectBar(leaf, view);
			}
		});

		// 清理不再处于预览模式的叶子
		for (const [leaf, entry] of this.barMap.entries()) {
			if (!activePrevLeaves.has(leaf)) {
				this.cleanupBar(entry);
				this.barMap.delete(leaf);
			}
		}
	}

	/**
	 * 向指定预览叶子注入进度条。
	 * 进度条作为 .markdown-preview-view 的第一个子元素，
	 * 但使用 absolute + transform 跟随 scrollTop，以固定在阅读视口顶端，
	 * 避免被正文顶部 padding 挤到更靠下的位置。
	 */
	private injectBar(leaf: WorkspaceLeaf, view: MarkdownView): void {
		const scrollEl = view.contentEl.querySelector<HTMLElement>(
			'.markdown-preview-view'
		);
		if (!scrollEl) return;

		const addedHostClass = this.ensurePositionContext(scrollEl);

		// 创建进度条元素
		const barEl = activeDocument.createElement('div');
		barEl.classList.add('es-progress-bar');
		barEl.setAttribute('aria-hidden', 'true');
		this.applyBarStyle(barEl);

		// 插入到滚动容器的第一个子元素之前
		scrollEl.insertBefore(barEl, scrollEl.firstChild);

		// 滚动处理器：根据 scrollTop / (scrollHeight - clientHeight) 计算百分比
		// 同时把进度条平移到当前可视区域顶部
		const handler = () => {
			const state = calculateProgressBarState(
				scrollEl.scrollTop,
				scrollEl.scrollHeight,
				scrollEl.clientHeight
			);
			barEl.style.width = state.width;
			barEl.style.transform = state.transform;
		};

		scrollEl.addEventListener('scroll', handler, { passive: true });
		handler();
		this.barMap.set(leaf, { barEl, handler, scrollEl, addedHostClass });
	}

	/** 将当前设置中的高度与颜色应用到进度条元素。 */
	private applyBarStyle(barEl: HTMLElement): void {
		const { barHeightPx, barColor } = this.plugin.settings.progress;
		barEl.style.height = `${barHeightPx}px`;
		barEl.style.backgroundColor = barColor;
	}

	/** 设置变更后，更新所有已注入进度条的样式。 */
	private updateAllBarStyles(): void {
		for (const entry of this.barMap.values()) {
			this.applyBarStyle(entry.barEl);
		}
	}

	private cleanupBar(entry: BarEntry): void {
		entry.scrollEl.removeEventListener('scroll', entry.handler);
		entry.barEl.remove();

		if (entry.addedHostClass) {
			entry.scrollEl.classList.remove('es-progress-host');
		}
	}

	/**
	 * 确保滚动容器是定位上下文（进度条用 absolute + transform 跟随）。
	 * 仅当容器原本为 static 时才添加 es-progress-host 类，并返回 true 以便清理时移除；
	 * 若容器已有定位（Obsidian/主题已设置），不动它，返回 false。
	 */
	private ensurePositionContext(scrollEl: HTMLElement): boolean {
		if (getComputedStyle(scrollEl).position !== 'static') {
			return false;
		}
		scrollEl.classList.add('es-progress-host');
		return true;
	}
}
