import type { I18nDict } from '../../locale';

interface TerminalCommandsI18n {
	openFileDir: { name: string };
	openVaultDir: { name: string };
	errorNoTerminal: string;
	errorLaunchFailed: string;
}

export const terminalCommandsI18n: I18nDict<TerminalCommandsI18n> = {
	zh: {
		openFileDir:  { name: '在终端中打开当前文件目录' },
		openVaultDir: { name: '在终端中打开 Vault 根目录' },
		errorNoTerminal:   '未检测到可用的终端，请在设置中手动指定。',
		errorLaunchFailed: '启动终端失败，请检查设置中配置的终端是否可用。',
	},
	en: {
		openFileDir:  { name: 'Open current file directory in terminal' },
		openVaultDir: { name: 'Open vault directory in terminal' },
		errorNoTerminal:   'No terminal found. Please specify one in settings.',
		errorLaunchFailed: 'Failed to launch terminal. Check the terminal configured in settings.',
	},
};
