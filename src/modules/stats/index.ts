import { MarkdownView, Setting } from 'obsidian';
import type { PluginModule } from '../../core/types';
import type EnhancementSuitePlugin from '../../main';
import { t } from '../../i18n/locale';
import { statsModuleI18n } from '../../i18n/modules/stats/module';
import { statsSettingsI18n } from '../../i18n/modules/stats/settings';

/**
 * Note Statistics Module — 字数统计模块
 *
 * 功能：
 *   - 在 Obsidian 状态栏实时显示当前笔记的字数与预计阅读时间
 *   - 同时统计 CJK 字符（中日韩）与拉丁词汇
 *   - 编辑器内容变化或切换文件时自动更新（防抖 300ms）
 *
 * 设计说明：
 *   - statusBarItem 在 onload() 中创建，onunload() 中移除
 *   - registerEvent() 注册的事件由 Obsidian 自动清理
 *   - updateTimer 在 onunload() 中手动清理
 *
 * 设置存储路径：plugin.settings.stats
 */
export class StatsModule implements PluginModule {
	readonly id = 'stats';
	readonly name = t(statsModuleI18n).name;
	readonly description = t(statsModuleI18n).description;

	/** Obsidian 状态栏元素。 */
	private statusBarItem: HTMLElement | null = null;

	/** 防抖定时器（300ms）。 */
	private updateTimer: number | null = null;

	constructor(private readonly plugin: EnhancementSuitePlugin) {}

	onload(): void {
		this.statusBarItem = this.plugin.addStatusBarItem();
		this.statusBarItem.addClass('es-stats-bar');

		// 编辑器内容变化时更新
		this.plugin.registerEvent(
			this.plugin.app.workspace.on('editor-change', () => this.scheduleUpdate())
		);

		// 切换文件时更新
		this.plugin.registerEvent(
			this.plugin.app.workspace.on('active-leaf-change', () => this.scheduleUpdate())
		);

		// 插件加载时立即更新一次
		this.scheduleUpdate();
	}

	onunload(): void {
		if (this.updateTimer !== null) {
			window.clearTimeout(this.updateTimer);
			this.updateTimer = null;
		}
		// 移除状态栏元素（Obsidian 不会自动移除 addStatusBarItem 创建的元素）
		if (this.statusBarItem) {
			this.statusBarItem.remove();
			this.statusBarItem = null;
		}
	}

	renderSettings(containerEl: HTMLElement): void {
		const i18n = t(statsSettingsI18n);

		new Setting(containerEl)
			.setName(i18n.chineseSpeed.name)
			.setDesc(i18n.chineseSpeed.desc)
			.addText((text) =>
				text
					.setValue(String(this.plugin.settings.stats.chineseReadingSpeed))
					.onChange(async (value) => {
						const n = parseInt(value, 10);
						if (n > 0) {
							this.plugin.settings.stats.chineseReadingSpeed = n;
							await this.plugin.saveSettings();
							this.scheduleUpdate();
						}
					})
			);

		new Setting(containerEl)
			.setName(i18n.englishSpeed.name)
			.setDesc(i18n.englishSpeed.desc)
			.addText((text) =>
				text
					.setValue(String(this.plugin.settings.stats.englishReadingSpeed))
					.onChange(async (value) => {
						const n = parseInt(value, 10);
						if (n > 0) {
							this.plugin.settings.stats.englishReadingSpeed = n;
							await this.plugin.saveSettings();
							this.scheduleUpdate();
						}
					})
			);
	}

	// ---------------------------------------------------------------------------
	// 私有方法
	// ---------------------------------------------------------------------------

	/** 防抖调度状态栏更新（300ms）。 */
	private scheduleUpdate(): void {
		if (this.updateTimer !== null) window.clearTimeout(this.updateTimer);
		this.updateTimer = window.setTimeout(() => {
			this.updateTimer = null;
			this.updateStatus();
		}, 300);
	}

	/** 读取当前编辑器内容，计算字数并更新状态栏文字。 */
	private updateStatus(): void {
		if (!this.statusBarItem) return;
		const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			this.statusBarItem.setText('');
			return;
		}
		const content = view.editor.getValue();
		const { wordCount, readMinutes } = this.countWords(content);
		const i18n = t(statsModuleI18n);
		this.statusBarItem.setText(i18n.statusText(wordCount, readMinutes));
	}

	/**
	 * 统计正文字数（CJK 字符 + 拉丁词汇）并估算阅读时间。
	 *
	 * 处理步骤：
	 *   1. 移除 YAML frontmatter
	 *   2. 移除围栏代码块与行内代码
	 *   3. 统计 CJK 字符数（每个字符算 1 词）
	 *   4. 统计拉丁词汇数（空格分隔的 ASCII 字母序列）
	 */
	private countWords(content: string): { wordCount: number; readMinutes: number } {
		// 移除 YAML frontmatter
		const stripped = content.replace(/^---\n[\s\S]*?\n---\n?/, '');

		// 移除围栏代码块与行内代码
		const noCode = stripped
			.replace(/```[\s\S]*?```/gm, ' ')
			.replace(/`[^`]+`/g, ' ');

		// CJK 字符（中文、日文假名、韩文）
		const cjkMatches = noCode.match(
			/[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u30ff\uac00-\ud7af]/g
		);
		const cjkCount = cjkMatches ? cjkMatches.length : 0;

		// 拉丁词汇（以字母开头，可含撇号和连字符）
		const latinMatches = noCode.match(/[a-zA-Z][a-zA-Z'-]*/g);
		const latinCount = latinMatches ? latinMatches.length : 0;

		const wordCount = cjkCount + latinCount;

		const { chineseReadingSpeed, englishReadingSpeed } = this.plugin.settings.stats;
		const minutes =
			cjkCount / Math.max(1, chineseReadingSpeed) +
			latinCount / Math.max(1, englishReadingSpeed);
		const readMinutes = Math.max(1, Math.round(minutes));

		return { wordCount, readMinutes };
	}
}
