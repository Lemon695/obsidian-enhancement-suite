import type { PluginModule } from '../../core/types';
import type EnhancementSuitePlugin from '../../main';
import { t } from '../../i18n/locale';
import { basesModuleI18n } from '../../i18n/modules/bases/module';
import { basesViewI18n } from '../../i18n/modules/bases/view';
import {
	MarkdownTableBasesView,
	MARKDOWN_TABLE_VIEW_ID,
} from './markdown-table-view';

/**
 * Bases Integration Module
 *
 * Registers a custom "Markdown Table" view type into Obsidian's Bases core plugin.
 * Users can select "Markdown Table" from the view-type selector inside any .base file,
 * gaining:
 *   - An interactive HTML table with sortable columns (▲ / ▼ / original)
 *   - A "Copy as Markdown" button that exports the current data
 *
 * Graceful degradation: `registerBasesView` returns `false` when Bases is disabled
 * or the Obsidian version is < 1.10. In that case this module silently does nothing.
 * No changes to `manifest.json` minAppVersion are required.
 */
export class BasesModule implements PluginModule {
	readonly id = 'bases';
	readonly name = t(basesModuleI18n).name;
	readonly description = t(basesModuleI18n).description;

	constructor(private readonly plugin: EnhancementSuitePlugin) {}

	onload(): void {
		const i18n = t(basesViewI18n);

		const registered = this.plugin.registerBasesView(MARKDOWN_TABLE_VIEW_ID, {
			name: i18n.viewName,
			icon: 'table',
			factory: (controller, containerEl) =>
				new MarkdownTableBasesView(controller, containerEl),
		});

		if (!registered) {
			console.debug(`[enhancement-suite] ${i18n.basesDisabled}`);
		}
	}

	onunload(): void {
		// `registerBasesView` is managed by Obsidian's Plugin lifecycle —
		// the view registration is automatically removed when the plugin unloads.
	}
}
