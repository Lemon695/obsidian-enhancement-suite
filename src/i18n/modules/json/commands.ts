import type { I18nDict } from '../../locale';

interface JsonCommandsI18n {
	openInViewer: { name: string };
	formatFile: { name: string };
	invalidJsonNotice: string;
	formattedNotice: string;
}

export const jsonCommandsI18n: I18nDict<JsonCommandsI18n> = {
	zh: {
		openInViewer: { name: '在 JSON 查看器中打开' },
		formatFile: { name: '格式化当前 JSON 文件' },
		invalidJsonNotice: '当前文件包含无效的 JSON，无法格式化。',
		formattedNotice: 'JSON 已格式化并保存。',
	},
	en: {
		openInViewer: { name: 'Open in JSON viewer' },
		formatFile: { name: 'Format current JSON file' },
		invalidJsonNotice: 'The current file contains invalid JSON and cannot be formatted.',
		formattedNotice: 'JSON formatted and saved.',
	},
};
