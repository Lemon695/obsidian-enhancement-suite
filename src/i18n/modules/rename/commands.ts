import type { I18nDict } from '../../locale';

interface RenameCommandsI18n {
	quickRename: string;
	openBatchPanel: string;
}

export const renameCommandsI18n: I18nDict<RenameCommandsI18n> = {
	zh: {
		quickRename: '快速重命名当前文件',
		openBatchPanel: '打开批量重命名面板',
	},
	en: {
		quickRename: 'Quick rename current file',
		openBatchPanel: 'Open batch rename panel',
	},
};
