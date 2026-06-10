import { TFile } from 'obsidian';
import type { PluginModule } from '../../core/types';
import type EnhancementSuitePlugin from '../../main';
import { t } from '../../i18n/locale';
import { renameModuleI18n } from '../../i18n/modules/rename/module';
import { renameCommandsI18n } from '../../i18n/modules/rename/commands';
import { QuickRenameModal } from './quick-rename-modal';
import { BatchRenameView, BATCH_RENAME_VIEW_ID } from './batch-rename-view';

/**
 * RenameModule — File renaming with pattern-based suggestions.
 *
 * Commands registered:
 *   - enhancement-suite:quick-rename — Opens QuickRenameModal for active file
 *   - enhancement-suite:open-batch-rename — Opens BatchRenameView tab
 *
 * Settings path: plugin.settings.rename
 */
export class RenameModule implements PluginModule {
	readonly id = 'rename';
	readonly name = t(renameModuleI18n).name;
	readonly description = t(renameModuleI18n).description;

	constructor(private readonly plugin: EnhancementSuitePlugin) {}

	onload(): void {
		// Register the batch rename ItemView
		this.plugin.registerView(
			BATCH_RENAME_VIEW_ID,
			(leaf) => new BatchRenameView(leaf, this.plugin),
		);

		// Command: quick rename current file
		this.plugin.addCommand({
			id: 'quick-rename',
			name: t(renameCommandsI18n).quickRename,
			checkCallback: (checking: boolean) => {
				const file = this.plugin.app.workspace.getActiveFile();
				if (!file || !(file instanceof TFile)) return false;
				if (!checking) {
					new QuickRenameModal(this.plugin.app, file).open();
				}
				return true;
			},
		});

		// Command: open batch rename panel
		this.plugin.addCommand({
			id: 'open-batch-rename',
			name: t(renameCommandsI18n).openBatchPanel,
			callback: () => void this.openBatchRenameView(),
		});
	}

	onunload(): void {
		// 不在 onunload 中 detachLeavesOfType：
		// Obsidian 会自行处理已注册视图的叶子，手动 detach 反而会在下次加载时
		// 把用户手动摆放的面板重置回默认位置（见 obsidianmd/detach-leaves 规则）。
	}

	// ----------------------------------------------------------------

	private async openBatchRenameView(): Promise<void> {
		const existing = this.plugin.app.workspace.getLeavesOfType(BATCH_RENAME_VIEW_ID);
		if (existing.length > 0) {
			void this.plugin.app.workspace.revealLeaf(existing[0]!);
			return;
		}
		const leaf = this.plugin.app.workspace.getLeaf('tab');
		await leaf.setViewState({ type: BATCH_RENAME_VIEW_ID, active: true });
		void this.plugin.app.workspace.revealLeaf(leaf);
	}
}
