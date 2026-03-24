import type { I18nDict } from '../../locale';

interface BaseCommandsI18n {
	openInViewer: { name: string };
	formatFile: { name: string };
	invalidBaseNotice: string;
	formattedNotice: string;
	notABaseFileNotice: string;
}

export const baseCommandsI18n: I18nDict<BaseCommandsI18n> = {
	zh: {
		openInViewer: { name: '在 Base 查看器中打开' },
		formatFile: { name: '格式化当前 Base 文件' },
		invalidBaseNotice: '当前文件包含无效的 Base 格式，无法格式化。',
		formattedNotice: 'Base 文件已格式化并保存。',
		notABaseFileNotice: '当前文件不是 .base 文件，无法在 Base 查看器中打开。',
	},
	en: {
		openInViewer: { name: 'Open in Base viewer' },
		formatFile: { name: 'Format current Base file' },
		invalidBaseNotice: 'The current file contains invalid Base format and cannot be formatted.',
		formattedNotice: 'Base file formatted and saved.',
		notABaseFileNotice: 'The current file is not a .base file and cannot be opened in Base viewer.',
	},
};
