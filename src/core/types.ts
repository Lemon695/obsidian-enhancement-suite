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
	/** 导出 HTML 时将 vault 内图片转为 Base64 data URI 内嵌（默认关闭）。 */
	embedImages: boolean;
}

export interface ReplaceModuleSettings {
	caseSensitive: boolean;
	useRegex: boolean;
}

export interface StatsModuleSettings {
	/** 中文阅读速度：字/分钟，默认 300。 */
	chineseReadingSpeed: number;
	/** 英文阅读速度：词/分钟，默认 200。 */
	englishReadingSpeed: number;
}

/** Footnotes 模块暂无独立设置项。 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FootnotesModuleSettings {}

/** Callout 模块暂无独立设置项。 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CalloutModuleSettings {}

export interface ProgressModuleSettings {
	/** 进度条高度（像素），默认 3。 */
	barHeightPx: number;
	/** 进度条颜色（CSS 颜色值），默认 var(--color-accent)。 */
	barColor: string;
}

export interface JsonModuleSettings {
	/** 在阅读模式下增强 Markdown 中的 JSON 代码块（默认 true）。 */
	enableCodeBlockEnhancer: boolean;
	/**
	 * 在源码编辑模式下，保存时自动将 JSON 格式化为 2 格缩进（默认 false）。
	 */
	formatOnSave: boolean;
}

export interface BaseModuleSettings {
	/** 在源码编辑模式下，保存时自动将 .base 文件格式化（默认 false）。 */
	formatOnSave: boolean;
}

/** Vault 模块暂无独立设置项。 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface VaultModuleSettings {}

/** Bases 模块暂无独立设置项。 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BasesModuleSettings {}

/** Rename 模块暂无独立设置项。 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RenameModuleSettings {}

/** Clipboard 模块暂无独立设置项。 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ClipboardModuleSettings {}

/** Paste Link 模块暂无独立设置项。 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PasteLinkModuleSettings {}

export interface TerminalModuleSettings {
	/** 'auto' 表示使用检测到的第一个终端；其余值为 TerminalId，如 'Warp' | 'iTerm' | 'Terminal'。 */
	preferredTerminal: string;
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
	stats: StatsModuleSettings;
	footnotes: FootnotesModuleSettings;
	callout: CalloutModuleSettings;
	progress: ProgressModuleSettings;
	json: JsonModuleSettings;
	base: BaseModuleSettings;
	vault: VaultModuleSettings;
	bases: BasesModuleSettings;
	rename: RenameModuleSettings;
	clipboard: ClipboardModuleSettings;
	terminal: TerminalModuleSettings;
	pasteLink: PasteLinkModuleSettings;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	moduleEnabled: {
		table: true,
		yaml: true,
		export: true,
		replace: true,
		stats: true,
		footnotes: true,
		callout: true,
		progress: true,
		json: true,
		base: true,
		vault: true,
		bases: true,
		rename: true,
		clipboard: true,
		terminal: true,
		pasteLink: true,
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
		embedImages: false,
	},
	replace: {
		caseSensitive: false,
		useRegex: false,
	},
	stats: {
		chineseReadingSpeed: 300,
		englishReadingSpeed: 200,
	},
	footnotes: {},
	callout: {},
	progress: {
		barHeightPx: 3,
		barColor: 'var(--color-accent)',
	},
	json: {
		enableCodeBlockEnhancer: true,
		formatOnSave: false,
	},
	base: {
		formatOnSave: false,
	},
	vault: {},
	bases: {},
	rename: {},
	clipboard: {},
	terminal: {
		preferredTerminal: 'auto',
	},
	pasteLink: {},
};
