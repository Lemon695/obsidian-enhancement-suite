import { Setting } from 'obsidian';
import type EnhancementSuitePlugin from '../../main';
import { t } from '../../i18n/locale';
import { tableSettingsI18n } from '../../i18n/modules/table/settings';

/**
 * Renders the Table module's settings UI into containerEl.
 *
 * Extracted into its own file to keep index.ts focused on module lifecycle.
 * Called by TableModule.renderSettings() via the settings tab.
 */
export function renderTableSettings(
	plugin: EnhancementSuitePlugin,
	containerEl: HTMLElement
): void {
	const i18n = t(tableSettingsI18n);

	new Setting(containerEl)
		.setName(i18n.enableSorting.name)
		.setDesc(i18n.enableSorting.desc)
		.addToggle((toggle) =>
			toggle
				.setValue(plugin.settings.table.enableSorting)
				.onChange(async (value) => {
					plugin.settings.table.enableSorting = value;
					await plugin.saveSettings();
				})
		);

	new Setting(containerEl)
		.setName(i18n.enableFiltering.name)
		.setDesc(i18n.enableFiltering.desc)
		.addToggle((toggle) =>
			toggle
				.setValue(plugin.settings.table.enableFiltering)
				.onChange(async (value) => {
					plugin.settings.table.enableFiltering = value;
					await plugin.saveSettings();
				})
		);
}
