import { Platform } from 'obsidian';
import { t } from 'i18n/locale';
import { vaultModuleI18n } from 'i18n/modules/vault/module';
import { vaultCommandsI18n } from 'i18n/modules/vault/commands';
import { VaultOpener } from './vault-opener';
import type { PluginModule } from 'core/types';
import type EnhancementSuitePlugin from 'main';

export class VaultModule implements PluginModule {
	readonly id = 'vault';

	get name(): string {
		return t(vaultModuleI18n).name;
	}

	get description(): string {
		return t(vaultModuleI18n).description;
	}

	private opener: VaultOpener;

	constructor(private readonly plugin: EnhancementSuitePlugin) {
		this.opener = new VaultOpener(plugin);
	}

	onload(): void {
		const i18n = t(vaultCommandsI18n);

		this.plugin.addCommand({
			id: 'vault-open-local',
			name: i18n.openLocalVault.name,
			// 仅在桌面端显示此命令（移动端无 Electron dialog）
			checkCallback: (checking: boolean) => {
				if (Platform.isMobileApp) return false;
				if (!checking) {
					this.opener.openVault().catch((e: unknown) => {
						console.error('[VaultModule] openVault error:', e);
					});
				}
				return true;
			},
		});
	}

	onunload(): void {
		// 命令由 Obsidian 自动清理，无需手动处理
	}
}
