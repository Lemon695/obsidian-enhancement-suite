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
