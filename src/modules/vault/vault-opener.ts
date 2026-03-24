import { Notice } from 'obsidian';
import { t } from 'i18n/locale';
import { vaultCommandsI18n } from 'i18n/modules/vault/commands';
import type EnhancementSuitePlugin from 'main';

// obsidian.json 中单个仓库条目的格式
interface VaultEntry {
	path: string;
	ts: number;
}

interface ObsidianConfig {
	vaults?: Record<string, VaultEntry>;
	[key: string]: unknown;
}

/**
 * 封装「打开本地仓库」的全部逻辑：
 *   1. 显示原生文件夹选择框（兼容新旧 Electron remote API）
 *   2. 将选中路径注册到 obsidian.json（若未注册）
 *   3. 通过 shell.openExternal + obsidian:// URI 触发 Obsidian 主进程打开仓库
 */
export class VaultOpener {
	constructor(private readonly plugin: EnhancementSuitePlugin) {}

	async openVault(): Promise<void> {
		const i18n = t(vaultCommandsI18n);

		// 1. 弹出文件夹选择框
		const selectedPath = await this.pickFolder(i18n.dialogTitle);
		if (!selectedPath) return; // 用户取消，静默退出

		// 2. 注册到 obsidian.json（已注册则跳过写入）
		const registered = this.registerVault(selectedPath);
		if (registered === null) return; // 配置读写失败，错误已通过 Notice 提示

		// 3. 显示通知并打开仓库
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const path = require('path') as typeof import('path');
		const vaultName = path.basename(selectedPath);
		new Notice(registered ? i18n.openingNotice(vaultName) : i18n.alreadyRegisteredNotice(vaultName));

		this.openVaultByName(vaultName);
	}

	/**
	 * 显示原生文件夹选择框。
	 * 优先使用 @electron/remote（Obsidian 1.x），回退到 electron.remote（旧版本）。
	 * 返回选中的绝对路径，取消则返回 null。
	 */
	private async pickFolder(title: string): Promise<string | null> {
		const opts = { properties: ['openDirectory' as const], title };

		try {
			// Obsidian 1.x：@electron/remote
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const remote = require('@electron/remote') as {
				dialog: {
					showOpenDialog(
						win: unknown,
						opts: unknown,
					): Promise<{ canceled: boolean; filePaths: string[] }>;
				};
				getCurrentWindow(): unknown;
			};
			const result = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), opts);
			if (result.canceled || result.filePaths.length === 0) return null;
			return result.filePaths[0] ?? null;
		} catch {
			try {
				// 旧版本回退：electron.remote
				// eslint-disable-next-line @typescript-eslint/no-require-imports
				const electron = require('electron') as {
					remote?: {
						dialog: {
							showOpenDialog(
								opts: unknown,
							): Promise<{ canceled: boolean; filePaths: string[] }>;
						};
					};
				};
				const remote = electron.remote;
				if (!remote) throw new Error('electron.remote not available');
				const result = await remote.dialog.showOpenDialog(opts);
				if (result.canceled || result.filePaths.length === 0) return null;
				return result.filePaths[0] ?? null;
			} catch (e) {
				console.error('[VaultOpener] pickFolder failed:', e);
				new Notice(t(vaultCommandsI18n).errorPickerFailed);
				return null;
			}
		}
	}

	/**
	 * 将仓库路径注册到 obsidian.json。
	 *   返回 true  — 新注册成功
	 *   返回 false — 路径已存在，无需写入
	 *   返回 null  — 读写失败（已通过 Notice 告知用户）
	 */
	private registerVault(vaultPath: string): boolean | null {
		const i18n = t(vaultCommandsI18n);

		const configPath = this.getConfigPath();
		if (!configPath) {
			new Notice(i18n.errorReadConfig);
			return null;
		}

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const fs = require('fs') as typeof import('fs');

		// 读取配置
		let config: ObsidianConfig;
		try {
			const raw = fs.readFileSync(configPath, 'utf-8');
			config = JSON.parse(raw) as ObsidianConfig;
		} catch (e) {
			console.error('[VaultOpener] read obsidian.json failed:', e);
			new Notice(i18n.errorReadConfig);
			return null;
		}

		// 检查是否已注册
		const vaults = config.vaults ?? {};
		const alreadyRegistered = Object.values(vaults).some((v) => v.path === vaultPath);
		if (alreadyRegistered) return false;

		// 生成 8 位随机 hex ID，写入新条目
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const crypto = require('crypto') as typeof import('crypto');
		const id = crypto.randomBytes(4).toString('hex');
		vaults[id] = { path: vaultPath, ts: Date.now() };
		config.vaults = vaults;

		try {
			fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
		} catch (e) {
			console.error('[VaultOpener] write obsidian.json failed:', e);
			new Notice(i18n.errorWriteConfig);
			return null;
		}

		return true;
	}

	/**
	 * 通过 obsidian:// URI 让 Obsidian 主进程打开指定名称的仓库。
	 * 主进程处理 URI 时会从磁盘重新读取 obsidian.json，因此刚写入的新条目可被发现。
	 */
	private openVaultByName(vaultName: string): void {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { shell } = require('electron') as {
			shell: { openExternal(url: string): Promise<void> };
		};
		const uri = `obsidian://open?vault=${encodeURIComponent(vaultName)}`;
		shell.openExternal(uri).catch((e: unknown) => {
			console.error('[VaultOpener] openExternal failed:', e);
		});
	}

	/**
	 * 获取 obsidian.json 的绝对路径（通过 Electron remote 的 app.getPath）。
	 */
	private getConfigPath(): string | null {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const path = require('path') as typeof import('path');

		try {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const remote = require('@electron/remote') as {
				app: { getPath(name: string): string };
			};
			return path.join(remote.app.getPath('appData'), 'obsidian', 'obsidian.json');
		} catch {
			try {
				// eslint-disable-next-line @typescript-eslint/no-require-imports
				const electron = require('electron') as {
					remote?: { app: { getPath(name: string): string } };
				};
				if (!electron.remote) return null;
				return path.join(
					electron.remote.app.getPath('appData'),
					'obsidian',
					'obsidian.json',
				);
			} catch {
				return null;
			}
		}
	}
}
