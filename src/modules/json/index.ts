import { Notice, Setting, TFile } from 'obsidian';
import type { PluginModule } from '../../core/types';
import type EnhancementSuitePlugin from '../../main';
import { JsonFileView, JSON_FILE_VIEW_TYPE } from './json-file-view';
import { CodeBlockEnhancer } from './code-block-enhancer';
import { parseJson, formatJson } from './parser';
import { t } from '../../i18n/locale';
import { jsonModuleI18n } from '../../i18n/modules/json/module';
import { jsonSettingsI18n } from '../../i18n/modules/json/settings';
import { jsonCommandsI18n } from '../../i18n/modules/json/commands';

/**
 * JSON Enhancement Module — JSON 文件增强模块
 *
 * 已实现功能：
 *   1. 自定义文件视图（JsonFileView）：
 *      - 注册 json-file-view 视图类型，拦截 .json 文件打开
 *      - 树形模式：可折叠/展开的 JSON 树（复用 yaml/json-viewer-modal 渲染）
 *      - 源码模式：可编辑 textarea + 实时校验 + 格式化
 *
 *   2. Markdown 代码块增强（CodeBlockEnhancer）：
 *      - ```json``` 代码块右上角注入「查看 JSON」按钮
 *      - 点击打开 JsonViewerModal
 *
 *   3. 命令：格式化当前 JSON 文件
 *
 * 设置存储路径：plugin.settings.json
 */
export class JsonModule implements PluginModule {
	readonly id = 'json';
	readonly name = t(jsonModuleI18n).name;
	readonly description = t(jsonModuleI18n).description;

	constructor(private readonly plugin: EnhancementSuitePlugin) {}

	onload(): void {
		this.registerFileView();
		this.registerCodeBlockEnhancer();
		this.registerCommands();
	}

	onunload(): void {
		// 不在 onunload 中 detachLeavesOfType：
		// Obsidian 会自行处理已注册视图的叶子，手动 detach 反而会在下次加载时
		// 把用户手动摆放的面板重置回默认位置（见 obsidianmd/detach-leaves 规则）。
	}

	renderSettings(containerEl: HTMLElement): void {
		const i18n = t(jsonSettingsI18n);

		new Setting(containerEl)
			.setName(i18n.enableCodeBlockEnhancer.name)
			.setDesc(i18n.enableCodeBlockEnhancer.desc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.json.enableCodeBlockEnhancer)
					.onChange(async (value) => {
						this.plugin.settings.json.enableCodeBlockEnhancer = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(i18n.formatOnSave.name)
			.setDesc(i18n.formatOnSave.desc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.json.formatOnSave)
					.onChange(async (value) => {
						this.plugin.settings.json.formatOnSave = value;
						await this.plugin.saveSettings();
					}),
			);
	}

	// ---------------------------------------------------------------------------
	// 私有方法
	// ---------------------------------------------------------------------------

	/** 注册自定义 JSON 文件视图。 */
	private registerFileView(): void {
		this.plugin.registerView(
			JSON_FILE_VIEW_TYPE,
			(leaf) => new JsonFileView(leaf, this.plugin),
		);
		// 告知 Obsidian 用此视图类型打开 .json 文件
		this.plugin.registerExtensions(['json'], JSON_FILE_VIEW_TYPE);
	}

	/** 注册 Markdown JSON 代码块增强器。 */
	private registerCodeBlockEnhancer(): void {
		new CodeBlockEnhancer(this.plugin).register();
	}

	/** 注册命令。 */
	private registerCommands(): void {
		const i18n = t(jsonCommandsI18n);

		// 命令：格式化当前 JSON 文件
		this.plugin.addCommand({
			id: 'json-format-file',
			name: i18n.formatFile.name,
			checkCallback: (checking: boolean) => {
				const file = this.plugin.app.workspace.getActiveFile();
				if (!file || file.extension !== 'json') return false;
				if (!checking) {
					this.formatActiveFile(file).catch((e) => {
						console.error('[enhancement-suite] JSON format error:', e);
					});
				}
				return true;
			},
		});
	}

	/** 读取当前活跃的 JSON 文件，格式化后写回。 */
	private async formatActiveFile(file: TFile): Promise<void> {
		const i18n = t(jsonCommandsI18n);
		const content = await this.plugin.app.vault.read(file);
		const result = parseJson(content);

		if (!result.ok) {
			new Notice(i18n.invalidJsonNotice);
			return;
		}

		await this.plugin.app.vault.modify(file, formatJson(result.value));
		new Notice(i18n.formattedNotice);
	}
}
