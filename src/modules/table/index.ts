import type { PluginModule } from '../../core/types';
import type EnhancementSuitePlugin from '../../main';
import { renderTableSettings } from './settings';
import { t } from '../../i18n/locale';
import { tableModuleI18n } from '../../i18n/modules/table/module';
import { tableCommandsI18n } from '../../i18n/modules/table/commands';

/**
 * Table Enhancement Module
 *
 * Adds interactive features to Markdown tables rendered in Reading View:
 *   - Column sorting (click a header to sort rows ascending / descending)
 *   - Row filtering (type to hide non-matching rows)
 *
 * Commands registered here use plugin.addCommand(), which Obsidian
 * automatically unregisters when the plugin unloads — no manual cleanup needed.
 *
 * Future work:
 *   - Register a MarkdownPostProcessor to inject sort/filter controls into
 *     rendered table DOM elements.
 */
export class TableModule implements PluginModule {
	readonly id = 'table';
	readonly name = t(tableModuleI18n).name;
	readonly description = t(tableModuleI18n).description;

	constructor(private readonly plugin: EnhancementSuitePlugin) {}

	onload(): void {
		this.registerCommands();
		// TODO: register a MarkdownPostProcessor to inject interactive controls
		// this.plugin.registerMarkdownPostProcessor((el, ctx) => { ... });
	}

	onunload(): void {
		// Commands are cleaned up automatically by Obsidian.
		// If a MarkdownPostProcessor is registered, Obsidian also cleans that up.
		// Add explicit cleanup here only if you hold external references.
	}

	renderSettings(containerEl: HTMLElement): void {
		renderTableSettings(this.plugin, containerEl);
	}

	// ---------------------------------------------------------------------------
	// Private helpers
	// ---------------------------------------------------------------------------

	private registerCommands(): void {
		const i18n = t(tableCommandsI18n);

		this.plugin.addCommand({
			id: 'table-sort-column-asc',
			name: i18n.sortAsc.name,
			editorCallback: (_editor, _view) => {
				// TODO: resolve the column at cursor position and sort the table ASC
			},
		});

		this.plugin.addCommand({
			id: 'table-sort-column-desc',
			name: i18n.sortDesc.name,
			editorCallback: (_editor, _view) => {
				// TODO: resolve the column at cursor position and sort the table DESC
			},
		});
	}
}
