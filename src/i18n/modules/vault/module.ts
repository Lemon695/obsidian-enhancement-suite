import type { I18nDict } from '../../locale';

interface VaultModuleI18n {
	name: string;
	description: string;
}

export const vaultModuleI18n: I18nDict<VaultModuleI18n> = {
	zh: {
		name: '仓库管理',
		description: '通过文件夹选择器打开任意本地 Obsidian 仓库，支持从未在本机打开过的仓库。',
	},
	en: {
		name: 'Vault Manager',
		description: 'Open any local Obsidian vault via folder picker, including vaults never opened on this machine.',
	},
};
