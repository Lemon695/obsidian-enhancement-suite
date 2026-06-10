import { Setting } from 'obsidian';
import type { PluginModule } from '../../core/types';
import type EnhancementSuitePlugin from '../../main';
import { ExportModal } from './modal';
import { BatchExportModal } from './batch-modal';
import { t } from '../../i18n/locale';
import { exportModuleI18n } from '../../i18n/modules/export/module';
import { exportSettingsI18n } from '../../i18n/modules/export/settings';
import { exportCommandsI18n } from '../../i18n/modules/export/commands';

/**
 * Export Enhancement Module — 多格式导出模块
 *
 * 已实现功能：
 *   - 导出为标准 Markdown（清理 Obsidian 专有语法）
 *   - 导出为独立 HTML 文档（含内联样式）
 *   - HTML 导出时可选内嵌 vault 图片为 Base64 data URI（设置项 embedImages）
 *   - PDF 导出（调用 Obsidian 内置命令，或显示操作指引）
 *   - 输出文件保存到 Vault 根目录，自动避免同名覆盖
 *
 * 设置存储路径：plugin.settings.export
 */
export class ExportModule implements PluginModule {
	readonly id = 'export';
	readonly name = t(exportModuleI18n).name;
	readonly description = t(exportModuleI18n).description;

	constructor(private readonly plugin: EnhancementSuitePlugin) {}

	onload(): void {
		const i18n = t(exportCommandsI18n);

		this.plugin.addCommand({
			id: 'export-note',
			name: i18n.exportNote.name,
			checkCallback: (checking: boolean) => {
				const file = this.plugin.app.workspace.getActiveFile();
				if (!file) return false;
				if (!checking) {
					new ExportModal(this.plugin.app, this.plugin, file).open();
				}
				return true;
			},
		});

		this.plugin.addCommand({
			id: 'export-batch',
			name: i18n.batchExport.name,
			callback: () => {
				new BatchExportModal(this.plugin.app, this.plugin).open();
			},
		});
	}

	onunload(): void {
		// 命令由 Obsidian 自动清理。
	}

	renderSettings(containerEl: HTMLElement): void {
		const i18n = t(exportSettingsI18n);

		new Setting(containerEl)
			.setName(i18n.defaultFormat.name)
			.setDesc(i18n.defaultFormat.desc)
			.addDropdown((dropdown) =>
				dropdown
					.addOption('markdown', i18n.formatMarkdown)
					.addOption('html', i18n.formatHtml)
					.addOption('pdf', i18n.formatPdf)
					.setValue(this.plugin.settings.export.defaultFormat)
					.onChange(async (value) => {
						this.plugin.settings.export.defaultFormat = value as
							| 'markdown'
							| 'html'
							| 'pdf';
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(i18n.embedImages.name)
			.setDesc(i18n.embedImages.desc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.export.embedImages)
					.onChange(async (value) => {
						this.plugin.settings.export.embedImages = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
