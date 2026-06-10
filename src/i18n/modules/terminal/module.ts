import type { I18nDict } from '../../locale';

interface TerminalModuleI18n {
	name: string;
	description: string;
}

export const terminalModuleI18n: I18nDict<TerminalModuleI18n> = {
	zh: {
		name: '在终端中打开',
		description: '通过命令面板在系统终端中打开当前文件目录或 Vault 根目录。',
	},
	en: {
		name: 'Open in Terminal',
		description: 'Open the current file directory or vault root in the system terminal via command palette.',
	},
};
