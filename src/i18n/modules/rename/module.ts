import type { I18nDict } from '../../locale';

interface RenameModuleI18n {
	name: string;
	description: string;
	enabled: string;
}

export const renameModuleI18n: I18nDict<RenameModuleI18n> = {
	zh: {
		name: '文件重命名',
		description: '快速重命名当前文件（模式前缀/后缀）及批量重命名整个 Vault 文件',
		enabled: '启用文件重命名模块',
	},
	en: {
		name: 'File Rename',
		description: 'Quickly rename the current file with pattern-based prefixes/suffixes, and batch rename files across the vault.',
		enabled: 'Enable File Rename module',
	},
};
