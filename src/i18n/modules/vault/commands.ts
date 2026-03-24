import type { I18nDict } from '../../locale';

interface VaultCommandsI18n {
	openLocalVault: { name: string };
	dialogTitle: string;
	openingNotice: (name: string) => string;
	alreadyRegisteredNotice: (name: string) => string;
	errorReadConfig: string;
	errorWriteConfig: string;
	errorPickerFailed: string;
}

export const vaultCommandsI18n: I18nDict<VaultCommandsI18n> = {
	zh: {
		openLocalVault: { name: '打开本地仓库' },
		dialogTitle: '选择 Obsidian 仓库文件夹',
		openingNotice: (name) => `正在打开仓库：${name}`,
		alreadyRegisteredNotice: (name) => `仓库已注册，正在打开：${name}`,
		errorReadConfig: '无法读取 Obsidian 配置文件，请检查权限。',
		errorWriteConfig: '无法写入 Obsidian 配置文件，请检查权限。',
		errorPickerFailed: '无法打开文件夹选择框，请确认在桌面端使用。',
	},
	en: {
		openLocalVault: { name: 'Open local vault' },
		dialogTitle: 'Select Obsidian vault folder',
		openingNotice: (name) => `Opening vault: ${name}`,
		alreadyRegisteredNotice: (name) => `Vault already registered, opening: ${name}`,
		errorReadConfig: 'Cannot read Obsidian config. Check file permissions.',
		errorWriteConfig: 'Cannot write Obsidian config. Check file permissions.',
		errorPickerFailed: 'Cannot open folder picker. Make sure you are on desktop.',
	},
};
