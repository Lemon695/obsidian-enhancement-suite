/**
 * Minimal Obsidian mock for vitest unit tests.
 *
 * The unit tests only cover pure functions (formatter.ts, frontmatter.ts, searcher.ts).
 * These files may import Obsidian types for type annotations, but those types
 * are never instantiated during tests. Exporting empty stubs is sufficient.
 */

export class App {}
export class TFile {
	path = '';
	basename = '';
	extension = '';
	stat = { mtime: 0, ctime: 0, size: 0 };
	vault: unknown = null;
	parent: unknown = null;
	name = '';
}
export class Plugin {}
export class MarkdownView {
	contentEl = window.document?.createElement?.('div') ?? ({} as HTMLElement);
	getState(): { mode?: string } {
		return { mode: 'preview' };
	}
}
export class WorkspaceLeaf {
	view: unknown = null;
}
export class Modal {
	app: App;
	constructor(app: App) {
		this.app = app;
	}
	open() {}
	close() {}
}
export class Notice {
	constructor(_message: string, _timeout?: number) {}
}
export class Setting {
	constructor(_containerEl: HTMLElement) {}
}

/** Returns 'en' in test environment — i18n/locale.ts uses this to pick language. */
export function getLanguage(): string {
	return 'en';
}

/** YAML stubs — used by base/parser.ts unit tests */
export function parseYaml(content: string): unknown {
	try {
		return JSON.parse(content);
	} catch {
		return null;
	}
}

export function stringifyYaml(value: unknown): string {
	return JSON.stringify(value, null, 2);
}
