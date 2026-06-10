import { FileSystemAdapter, Notice, Platform, Setting } from 'obsidian';
import { t } from 'i18n/locale';
import { terminalModuleI18n } from 'i18n/modules/terminal/module';
import { terminalCommandsI18n } from 'i18n/modules/terminal/commands';
import { terminalSettingsI18n } from 'i18n/modules/terminal/settings';
import { TerminalLauncher } from './terminal-launcher';
import type { PluginModule } from 'core/types';
import type EnhancementSuitePlugin from 'main';

export class TerminalModule implements PluginModule {
	readonly id = 'terminal';

	get name(): string {
		return t(terminalModuleI18n).name;
	}

	get description(): string {
		return t(terminalModuleI18n).description;
	}

	private launcher: TerminalLauncher;

	constructor(private readonly plugin: EnhancementSuitePlugin) {
		this.launcher = new TerminalLauncher(plugin);
	}

	onload(): void {
		const i18n = t(terminalCommandsI18n);

		// ── Command 1: open current file's directory ────────────────────────
		this.plugin.addCommand({
			id: 'terminal-open-file-dir',
			name: i18n.openFileDir.name,
			checkCallback: (checking: boolean) => {
				if (Platform.isMobileApp) return false;
				const file = this.plugin.app.workspace.getActiveFile();
				if (!file) return false;
				if (!checking) {
					const basePath = this.getVaultBasePath();
					if (!basePath) {
						new Notice(t(terminalCommandsI18n).errorNoTerminal);
						return;
					}
					// eslint-disable-next-line @typescript-eslint/no-require-imports -- Node.js built-ins must be loaded via require() at runtime in Obsidian's Electron environment
					const path = require('path') as typeof import('path');
					const absDir = path.dirname(path.join(basePath, file.path));
					this.launcher.launch(absDir);
				}
				return true;
			},
		});

		// ── Command 2: open vault root directory ─────────────────────────────
		this.plugin.addCommand({
			id: 'terminal-open-vault-dir',
			name: i18n.openVaultDir.name,
			checkCallback: (checking: boolean) => {
				if (Platform.isMobileApp) return false;
				if (!checking) {
					const basePath = this.getVaultBasePath();
					if (!basePath) {
						new Notice(t(terminalCommandsI18n).errorNoTerminal);
						return;
					}
					this.launcher.launch(basePath);
				}
				return true;
			},
		});
	}

	onunload(): void {
		// Commands are auto-cleaned by Obsidian on plugin unload.
	}

	renderSettings(containerEl: HTMLElement): void {
		const i18n = t(terminalSettingsI18n);

		// Mobile: commands are hidden via checkCallback — show an explanation.
		if (Platform.isMobileApp) {
			containerEl.createEl('p', {
				text: i18n.desktopOnlyNotice,
				cls: 'es-terminal-mobile-notice',
			});
			return;
		}

		const detected = this.launcher.detect();
		const autoLabel = this.launcher.autoLabel();
		const settings = this.plugin.settings.terminal;

		// Build dropdown: auto option + one entry per detected terminal
		const options: Record<string, string> = {
			auto: i18n.autoOption(autoLabel),
		};
		for (const term of detected) {
			options[term.id] = term.label;
		}

		new Setting(containerEl)
			.setName(i18n.terminalPickerName)
			.setDesc(i18n.terminalPickerDesc)
			.addDropdown((dd) =>
				dd
					.addOptions(options)
					.setValue(settings.preferredTerminal)
					.onChange(async (value) => {
						settings.preferredTerminal = value;
						await this.plugin.saveSettings();
					}),
			);
	}

	// ── private ─────────────────────────────────────────────────────────────

	private getVaultBasePath(): string | null {
		const adapter = this.plugin.app.vault.adapter;
		if (adapter instanceof FileSystemAdapter) {
			return adapter.getBasePath();
		}
		return null;
	}
}
