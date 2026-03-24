import { Plugin } from 'obsidian';
import { ModuleManager } from './core/module-manager';
import { EnhancementSettingsTab } from './core/settings-tab';
import { DEFAULT_SETTINGS, PluginSettings } from './core/types';
import { TableModule } from './modules/table';
import { YamlModule } from './modules/yaml';
import { ExportModule } from './modules/export';
import { ReplaceModule } from './modules/replace';
import { StatsModule } from './modules/stats';
import { FootnotesModule } from './modules/footnotes';
import { CalloutModule } from './modules/callout';
import { ProgressModule } from './modules/progress';
import { JsonModule } from './modules/json';
import { BaseModule } from './modules/base';

/**
 * EnhancementSuitePlugin — the Obsidian plugin entry point.
 *
 * This class has exactly three jobs:
 *   1. Initialize ModuleManager
 *   2. Register all feature modules (one line each)
 *   3. Delegate load / unload / settings to the manager and the settings tab
 *
 * No feature logic belongs here. Add it to the relevant module instead.
 *
 * To add a new module:
 *   1. Implement PluginModule in src/modules/<name>/index.ts
 *   2. Add its settings to PluginSettings in src/core/types.ts
 *   3. Register it below with: this.moduleManager.register(new MyModule(this))
 */
export default class EnhancementSuitePlugin extends Plugin {
	settings: PluginSettings;
	moduleManager: ModuleManager;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.moduleManager = new ModuleManager(this);

		// ----- Register modules here ----------------------------------------
		// Each line introduces one feature module. Order = display order in settings.
		this.moduleManager.register(new TableModule(this));
		this.moduleManager.register(new YamlModule(this));
		this.moduleManager.register(new ExportModule(this));
		this.moduleManager.register(new ReplaceModule(this));
		this.moduleManager.register(new StatsModule(this));
		this.moduleManager.register(new FootnotesModule(this));
		this.moduleManager.register(new CalloutModule(this));
		this.moduleManager.register(new ProgressModule(this));
		this.moduleManager.register(new JsonModule(this));
		this.moduleManager.register(new BaseModule(this));
		// --------------------------------------------------------------------

		await this.moduleManager.loadAll();

		this.addSettingTab(new EnhancementSettingsTab(this.app, this));
	}

	onunload(): void {
		this.moduleManager.unloadAll();
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData() as Partial<PluginSettings>
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
