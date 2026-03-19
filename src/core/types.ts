/**
 * Core type definitions for the Enhancement Suite plugin.
 *
 * This file is the single source of truth for:
 *   - The PluginModule contract every feature module must fulfill
 *   - The global PluginSettings shape persisted to disk
 *   - Per-module settings interfaces
 *   - Default settings values
 */

// ---------------------------------------------------------------------------
// Module contract
// ---------------------------------------------------------------------------

/**
 * Every feature module must implement this interface.
 * ModuleManager uses it to load, unload, and render settings for each module.
 */
export interface PluginModule {
	/** Stable unique identifier. Used as the key in moduleEnabled and settings. */
	readonly id: string;

	/** Human-readable name shown in the settings UI. */
	readonly name: string;

	/** Short description shown below the module toggle in settings. */
	readonly description: string;

	/**
	 * Called when the module is activated.
	 * Register commands, events, and post-processors here.
	 * Commands registered via plugin.addCommand() are automatically removed
	 * when the plugin unloads, so no manual cleanup is needed for them.
	 */
	onload(): Promise<void> | void;

	/**
	 * Called when the module is deactivated or the plugin unloads.
	 * Only clean up things that Obsidian does not auto-clean
	 * (e.g., DOM mutations, third-party subscriptions).
	 */
	onunload(): void;

	/**
	 * Optional. Render module-specific settings into containerEl.
	 * Called by the settings tab when the module section is expanded.
	 * If not provided, no additional settings are shown for this module.
	 */
	renderSettings?(containerEl: HTMLElement): void;
}

// ---------------------------------------------------------------------------
// Per-module settings interfaces
// ---------------------------------------------------------------------------

export interface TableModuleSettings {
	enableSorting: boolean;
	enableFiltering: boolean;
}

export interface YamlModuleSettings {
	/** 在 frontmatter 编辑区域显示行号。 */
	showLineNumbers: boolean;
	/** 编辑时实时验证 frontmatter YAML 格式。 */
	validateOnChange: boolean;
	/**
	 * 在阅读模式 Properties 面板中，对 object / array 类型的属性值注入
	 * 右键复制菜单和点击查看器弹窗。
	 */
	enableJsonViewer: boolean;
}

export interface ExportModuleSettings {
	defaultFormat: 'markdown' | 'html' | 'pdf';
}

export interface ReplaceModuleSettings {
	caseSensitive: boolean;
	useRegex: boolean;
}

// ---------------------------------------------------------------------------
// Global plugin settings
// ---------------------------------------------------------------------------

/**
 * The complete settings object persisted by the plugin.
 *
 * Slices are keyed by module ID so each module reads/writes only its own data:
 *   plugin.settings.table   → TableModuleSettings
 *   plugin.settings.yaml    → YamlModuleSettings
 *   ...
 */
export interface PluginSettings {
	/**
	 * Tracks which modules are enabled.
	 * Keyed by module ID. Defaults to true for any missing key.
	 */
	moduleEnabled: Record<string, boolean>;

	table: TableModuleSettings;
	yaml: YamlModuleSettings;
	export: ExportModuleSettings;
	replace: ReplaceModuleSettings;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	moduleEnabled: {
		table: true,
		yaml: true,
		export: true,
		replace: true,
	},
	table: {
		enableSorting: true,
		enableFiltering: false,
	},
	yaml: {
		showLineNumbers: false,
		validateOnChange: true,
		enableJsonViewer: true,
	},
	export: {
		defaultFormat: 'markdown',
	},
	replace: {
		caseSensitive: false,
		useRegex: false,
	},
};
