import { MarkdownView, Setting } from 'obsidian';
import type { PluginModule } from '../../core/types';
import type EnhancementSuitePlugin from '../../main';
import { ReplaceModal } from './modal';
import { t } from '../../i18n/locale';
import { replaceModuleI18n } from '../../i18n/modules/replace/module';
import { replaceSettingsI18n } from '../../i18n/modules/replace/settings';
import { replaceCommandsI18n } from '../../i18n/modules/replace/commands';

/**
 * Text Replace Enhancement Module — 文本搜索替换模块
 *
 * 功能：
 *   - 在当前笔记中搜索关键词，支持大小写与正则
 *   - 结果实时预览，高亮显示匹配位置
 *   - 逐条替换（Replace）或一键全替（Replace All）
 *   - 使用 editor.replaceRange() 操作，保留 Undo 历史
 *
 * 设置存储路径：plugin.settings.replace
 */
export class ReplaceModule implements PluginModule {
	readonly id = 'replace';
	readonly name = t(replaceModuleI18n).name;
	readonly description = t(replaceModuleI18n).description;

	constructor(private readonly plugin: EnhancementSuitePlugin) {}

	onload(): void {
		const i18n = t(replaceCommandsI18n);

		this.plugin.addCommand({
			id: 'replace-open-panel',
			name: i18n.openPanel.name,
			checkCallback: (checking: boolean) => {
				const hasEditor =
					!!this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
				if (!checking && hasEditor) {
					new ReplaceModal(this.plugin.app, this.plugin).open();
				}
				return hasEditor;
			},
		});
	}

	onunload(): void {
		// 命令由 Obsidian 自动清理，无需手动处理。
	}

	renderSettings(containerEl: HTMLElement): void {
		const i18n = t(replaceSettingsI18n);

		new Setting(containerEl)
			.setName(i18n.caseSensitive.name)
			.setDesc(i18n.caseSensitive.desc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.replace.caseSensitive)
					.onChange(async (value) => {
						this.plugin.settings.replace.caseSensitive = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(i18n.useRegex.name)
			.setDesc(i18n.useRegex.desc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.replace.useRegex)
					.onChange(async (value) => {
						this.plugin.settings.replace.useRegex = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
