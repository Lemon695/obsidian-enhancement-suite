import { Notice, Setting, TFile } from 'obsidian';
import type { PluginModule } from '../../core/types';
import type EnhancementSuitePlugin from '../../main';
import { BaseFileView, BASE_FILE_VIEW_TYPE } from './base-file-view';
import { parseBase, formatBase } from './parser';
import { t } from '../../i18n/locale';
import { baseModuleI18n } from '../../i18n/modules/base/module';
import { baseSettingsI18n } from '../../i18n/modules/base/settings';
import { baseCommandsI18n } from '../../i18n/modules/base/commands';

/**
 * Base Enhancement Module — .base 文件增强模块
 *
 * 已实现功能：
 *   1. 自定义文件视图（BaseFileView）：
 *      - 注册 base-file-view 视图类型，拦截 .base 文件打开
 *      - 树形模式：可折叠/展开的 YAML 树（复用 yaml/json-viewer-modal 渲染）
 *      - 源码模式：可编辑 textarea + 实时校验 + 格式化
 *
 *   2. 右键菜单集成：
 *      - 在文件浏览器中右键 .base 文件显示「在 Base 查看器中打开」菜单项
 *
 *   3. 命令：格式化当前 Base 文件
 *
 * 设置存储路径：plugin.settings.base
 */
export class BaseModule implements PluginModule {
	readonly id = 'base';
	readonly name = t(baseModuleI18n).name;
	readonly description = t(baseModuleI18n).description;

	constructor(private readonly plugin: EnhancementSuitePlugin) {}

	onload(): void {
		this.registerFileView();
		this.registerContextMenu();
		this.registerCommands();
	}

	onunload(): void {
		// 不在 onunload 中 detachLeavesOfType：
		// Obsidian 会自行处理已注册视图的叶子，手动 detach 反而会在下次加载时
		// 把用户手动摆放的面板重置回默认位置（见 obsidianmd/detach-leaves 规则）。
	}

	renderSettings(containerEl: HTMLElement): void {
		const i18n = t(baseSettingsI18n);

		new Setting(containerEl)
			.setName(i18n.formatOnSave.name)
			.setDesc(i18n.formatOnSave.desc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.base.formatOnSave)
					.onChange(async (value) => {
						this.plugin.settings.base.formatOnSave = value;
						await this.plugin.saveSettings();
					}),
			);
	}

	/** 注册 .base 文件的自定义视图类型（不拦截双击，不取代原生 Bases 视图）。 */
	private registerFileView(): void {
		this.plugin.registerView(
			BASE_FILE_VIEW_TYPE,
			(leaf) => new BaseFileView(leaf, this.plugin),
		);
	}

	/** 在文件浏览器右键菜单中为 .base 文件注入菜单项。 */
	private registerContextMenu(): void {
		const i18n = t(baseCommandsI18n);

		this.plugin.registerEvent(
			this.plugin.app.workspace.on('file-menu', (menu, file) => {
				if (!(file instanceof TFile) || file.extension !== 'base') return;
				menu.addItem((item) =>
					item
						.setTitle(i18n.openInViewer.name)
						.setIcon('database')
						.onClick(async () => {
							const leaf =
								this.plugin.app.workspace.getLeaf('tab');
							// 显式指定视图类型，绕过 .base 扩展名被原生 Bases 插件占用的问题
							await leaf.setViewState({
								type: BASE_FILE_VIEW_TYPE,
								state: { file: file.path },
							});
							void this.plugin.app.workspace.revealLeaf(leaf);
						}),
				);
			}),
		);
	}

	/** 注册命令。 */
	private registerCommands(): void {
		const i18n = t(baseCommandsI18n);

		// 命令：在 Base 查看器中打开（任何文件都可触发，非 .base 文件给出提示）
		this.plugin.addCommand({
			id: 'base-open-in-viewer',
			name: i18n.openInViewer.name,
			callback: () => {
				const file = this.plugin.app.workspace.getActiveFile();
				if (!file || file.extension !== 'base') {
					new Notice(i18n.notABaseFileNotice);
					return;
				}
				const leaf = this.plugin.app.workspace.getLeaf('tab');
				leaf.setViewState({
					type: BASE_FILE_VIEW_TYPE,
					state: { file: file.path },
				}).then(() => {
					void this.plugin.app.workspace.revealLeaf(leaf);
				}).catch((e) => {
					console.error('[enhancement-suite] Base open error:', e);
				});
			},
		});

		// 命令：格式化当前 Base 文件
		this.plugin.addCommand({
			id: 'base-format-file',
			name: i18n.formatFile.name,
			checkCallback: (checking: boolean) => {
				const file = this.plugin.app.workspace.getActiveFile();
				if (!file || file.extension !== 'base') return false;
				if (!checking) {
					this.formatActiveFile(file).catch((e) => {
						console.error('[enhancement-suite] Base format error:', e);
					});
				}
				return true;
			},
		});
	}

	/** 读取当前活跃的 .base 文件，格式化后写回。 */
	private async formatActiveFile(file: TFile): Promise<void> {
		const i18n = t(baseCommandsI18n);
		const content = await this.plugin.app.vault.read(file);
		const result = parseBase(content);

		if (!result.ok) {
			new Notice(i18n.invalidBaseNotice);
			return;
		}

		await this.plugin.app.vault.modify(file, formatBase(result.value));
		new Notice(i18n.formattedNotice);
	}
}
