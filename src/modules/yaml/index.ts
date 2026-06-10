import { MarkdownView, Notice, Setting, TFile } from 'obsidian';
import type { PluginModule } from '../../core/types';
import type EnhancementSuitePlugin from '../../main';
import {
	extractFrontmatter,
	validateFrontmatterYaml,
	parseFrontmatterFields,
	hasFrontmatter,
} from './frontmatter';
import { PropertyEnhancer } from './property-enhancer';
import { BatchPropertyModal } from './batch-property-modal';
import { t } from '../../i18n/locale';
import { yamlModuleI18n } from '../../i18n/modules/yaml/module';
import { yamlSettingsI18n } from '../../i18n/modules/yaml/settings';
import { yamlCommandsI18n } from '../../i18n/modules/yaml/commands';

/**
 * YAML Enhancement Module — YAML frontmatter 增强模块
 *
 * 已实现功能：
 *   - 实时验证：编辑器内容变化时，若 frontmatter 存在格式错误，
 *     通过 Notice 提示具体错误位置与原因（防抖 300ms）
 *   - 命令：显示当前文件 frontmatter 的结构摘要（字段数、各键名）
 *   - 命令：手动触发 frontmatter 验证
 *   - JSON 属性查看器：在阅读模式 Properties 面板中，对 object/array 类型的
 *     属性值注入右键复制菜单和点击查看器弹窗（防抖 50ms）
 *
 * 设计说明：
 *   - 使用 plugin.registerEvent() 监听 editor-change / active-leaf-change /
 *     layout-change，插件卸载时自动清理
 *   - validationTimer / enhanceTimer 在 onunload() 中手动清理
 *
 * 设置存储路径：plugin.settings.yaml
 */
export class YamlModule implements PluginModule {
	readonly id = 'yaml';
	readonly name = t(yamlModuleI18n).name;
	readonly description = t(yamlModuleI18n).description;

	/** 防抖定时器：frontmatter 验证（300ms）。 */
	private validationTimer: number | null = null;

	/** 防抖定时器：Properties 面板增强（50ms）。 */
	private enhanceTimer: number | null = null;

	/** Properties 面板 DOM 增强器实例。 */
	private readonly enhancer: PropertyEnhancer;

	constructor(private readonly plugin: EnhancementSuitePlugin) {
		this.enhancer = new PropertyEnhancer(plugin.app);
	}

	onload(): void {
		this.registerValidationListener();
		this.registerCommands();
		this.registerPropertyEnhancer();
	}

	onunload(): void {
		// registerEvent() 注册的事件由 Obsidian 自动清理。
		// setTimeout 不由 Obsidian 管理，需要手动清理。
		if (this.validationTimer !== null) {
			window.clearTimeout(this.validationTimer);
			this.validationTimer = null;
		}
		if (this.enhanceTimer !== null) {
			window.clearTimeout(this.enhanceTimer);
			this.enhanceTimer = null;
		}
	}

	renderSettings(containerEl: HTMLElement): void {
		const i18n = t(yamlSettingsI18n);

		new Setting(containerEl)
			.setName(i18n.validateOnChange.name)
			.setDesc(i18n.validateOnChange.desc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.yaml.validateOnChange)
					.onChange(async (value) => {
						this.plugin.settings.yaml.validateOnChange = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(i18n.showLineNumbers.name)
			.setDesc(i18n.showLineNumbers.desc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.yaml.showLineNumbers)
					.onChange(async (value) => {
						this.plugin.settings.yaml.showLineNumbers = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(i18n.jsonViewer.name)
			.setDesc(i18n.jsonViewer.desc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.yaml.enableJsonViewer)
					.onChange(async (value) => {
						this.plugin.settings.yaml.enableJsonViewer = value;
						await this.plugin.saveSettings();
					})
			);
	}

	// ---------------------------------------------------------------------------
	// 私有方法
	// ---------------------------------------------------------------------------

	/** 注册 editor-change 事件监听器，防抖 300ms 后触发验证。 */
	private registerValidationListener(): void {
		this.plugin.registerEvent(
			this.plugin.app.workspace.on('editor-change', (_editor, info) => {
				if (!this.plugin.settings.yaml.validateOnChange) return;
				if (!(info instanceof MarkdownView)) return;

				if (this.validationTimer !== null) {
					window.clearTimeout(this.validationTimer);
				}
				this.validationTimer = window.setTimeout(() => {
					this.validateCurrentFile(info);
					this.validationTimer = null;
				}, 300);
			})
		);
	}

	/** 注册命令：摘要与手动验证。 */
	private registerCommands(): void {
		const i18n = t(yamlCommandsI18n);

		this.plugin.addCommand({
			id: 'yaml-show-frontmatter-summary',
			name: i18n.showSummary.name,
			checkCallback: (checking: boolean) => {
				const file = this.plugin.app.workspace.getActiveFile();
				if (!file) return false;
				if (!checking) {
					this.showFrontmatterSummary(file).catch((e) => {
						console.error('[enhancement-suite] YAML summary error:', e);
					});
				}
				return true;
			},
		});

		this.plugin.addCommand({
			id: 'yaml-validate-frontmatter',
			name: i18n.validate.name,
			checkCallback: (checking: boolean) => {
				const view =
					this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view) return false;
				if (!checking) this.validateCurrentFile(view, true);
				return true;
			},
		});

		this.plugin.addCommand({
			id: 'yaml-batch-edit-property',
			name: i18n.batchEditProperty.name,
			callback: () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();
				new BatchPropertyModal(this.plugin.app, activeFile).open();
			},
		});
	}

	/**
	 * 注册 Properties 面板增强器。
	 * 监听 active-leaf-change 和 layout-change 事件（防抖 50ms），
	 * 在阅读模式叶子变为活跃时扫描并增强属性值元素。
	 */
	private registerPropertyEnhancer(): void {
		const schedule = () => {
			if (this.enhanceTimer !== null) window.clearTimeout(this.enhanceTimer);
			this.enhanceTimer = window.setTimeout(() => {
				this.enhanceTimer = null;
				this.enhanceActiveLeaf();
			}, 50);
		};

		this.plugin.registerEvent(
			this.plugin.app.workspace.on('active-leaf-change', schedule),
		);
		this.plugin.registerEvent(
			this.plugin.app.workspace.on('layout-change', schedule),
		);

		// 插件加载时也尝试增强当前活跃叶子
		schedule();
	}

	/**
	 * 增强当前活跃叶子的 Properties 面板。
	 * 仅在阅读模式（preview）下运行；编辑模式不干预 Obsidian 原生属性编辑行为。
	 */
	private enhanceActiveLeaf(): void {
		if (!this.plugin.settings.yaml.enableJsonViewer) return;

		const view =
			this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;

		// 仅处理阅读模式；live-preview / source 不增强
		const viewState = view.getState() as unknown as { mode?: string };
		if (viewState.mode !== 'preview') return;

		const file = view.file;
		if (!file) return;

		const frontmatter =
			this.plugin.app.metadataCache.getFileCache(file)?.frontmatter;
		if (!frontmatter) return;

		// .metadata-container 在阅读模式下存在；如果不存在则无需处理
		const container =
			view.contentEl.querySelector<HTMLElement>('.metadata-container');
		if (!container) return;

		this.enhancer.enhance(
			container,
			frontmatter as Record<string, unknown>,
		);
	}

	/**
	 * 验证当前 MarkdownView 的 frontmatter。
	 * @param forceNotify 为 true 时，即使无错误也显示成功 Notice（手动触发时使用）。
	 */
	private validateCurrentFile(
		view: MarkdownView,
		forceNotify = false
	): void {
		const i18n = t(yamlCommandsI18n);
		const content = view.editor.getValue();

		if (!hasFrontmatter(content)) {
			if (forceNotify) new Notice(i18n.noFrontmatter);
			return;
		}

		const region = extractFrontmatter(content);
		if (!region) {
			if (forceNotify) new Notice(i18n.notClosed);
			return;
		}

		const errors = validateFrontmatterYaml(region.content);

		if (errors.length === 0) {
			if (forceNotify) new Notice(i18n.valid);
			return;
		}

		const first = errors[0];
		if (first) {
			new Notice(`${i18n.errorPrefix}${first.message}`, 5000);
		}
	}

	/** 读取文件后，将 frontmatter 字段摘要显示在 Notice 中。 */
	private async showFrontmatterSummary(file: TFile): Promise<void> {
		const i18n = t(yamlCommandsI18n);
		const content = await this.plugin.app.vault.read(file);
		const region = extractFrontmatter(content);

		if (!region) {
			new Notice(i18n.summaryNoFrontmatter(file.basename));
			return;
		}

		const fields = parseFrontmatterFields(region.content);
		const errors = validateFrontmatterYaml(region.content);

		const lines: string[] = [
			i18n.summaryTitle(file.basename),
			i18n.summaryFields(fields.length, fields.map((f) => f.key).join(', ')),
		];

		if (errors.length > 0) {
			lines.push(i18n.summaryErrors(errors.length));
			for (const e of errors.slice(0, 5)) {
				lines.push(`  ${e.message}`);
			}
		} else {
			lines.push(i18n.summaryNoErrors);
		}

		new Notice(lines.join('\n'), 8000);
	}
}
