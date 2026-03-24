import type { I18nDict } from '../../locale';

interface JsonModuleI18n {
	name: string;
	description: string;
}

export const jsonModuleI18n: I18nDict<JsonModuleI18n> = {
	zh: {
		name: 'JSON 增强',
		description: '为 .json 文件提供树形查看与编辑视图，并增强 Markdown 中的 JSON 代码块。',
	},
	en: {
		name: 'JSON Enhancement',
		description:
			'Tree viewer and editor for .json files, plus interactive JSON code block enhancement in Markdown notes.',
	},
};
