import { App, PluginSettingTab, Setting } from 'obsidian';
import type EnhancementSuitePlugin from '../main';
import { t } from '../i18n/locale';
import { settingsTabI18n } from '../i18n/core/settings-tab';

/**
 * Top-level settings tab for the Enhancement Suite plugin.
 *
 * Renders a toggle for each registered module. When a module is enabled,
 * any module-specific settings are rendered below its toggle by delegating
 * to the module's own renderSettings() method.
 *
 * This tab knows nothing about individual module settings — it only drives
 * the enable/disable lifecycle and acts as a container for module UIs.
 */
export class EnhancementSettingsTab extends PluginSettingTab {
	constructor(app: App, private readonly plugin: EnhancementSuitePlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const i18n = t(settingsTabI18n);
		containerEl.createEl('h2', { text: i18n.heading });
		containerEl.createEl('p', {
			text: i18n.intro,
			cls: 'enhancement-settings-intro',
		});

		for (const module of this.plugin.moduleManager.getAll()) {
			this.renderModuleSection(containerEl, module.id);
		}
	}

	private renderModuleSection(containerEl: HTMLElement, moduleId: string): void {
		const module = this.plugin.moduleManager.get(moduleId);
		if (!module) return;

		const sectionEl = containerEl.createDiv({ cls: 'enhancement-module-section' });

		// Module enable/disable toggle
		new Setting(sectionEl)
			.setName(module.name)
			.setDesc(module.description)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.moduleManager.isEnabled(module.id))
					.onChange(async (enabled) => {
						if (enabled) {
							await this.plugin.moduleManager.enableModule(module.id);
						} else {
							await this.plugin.moduleManager.disableModule(module.id);
						}
						// Re-render so module settings appear / disappear immediately
						this.display();
					});
			});

		// Module-specific settings (only shown when the module is enabled)
		const isEnabled = this.plugin.moduleManager.isEnabled(module.id);
		if (isEnabled && module.renderSettings) {
			const moduleSettingsEl = sectionEl.createDiv({
				cls: 'enhancement-module-settings',
			});
			module.renderSettings(moduleSettingsEl);
		}
	}
}
