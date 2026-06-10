import type { I18nDict } from '../../locale';

interface PasteLinkModuleI18n {
	name: string;
	description: string;
}

export const pasteLinkModuleI18n: I18nDict<PasteLinkModuleI18n> = {
	zh: {
		name: '粘贴为链接',
		description: '选中文字后粘贴 URL，自动替换为 Markdown 链接 [选中文字](url)。无选中时正常粘贴。',
	},
	en: {
		name: 'Paste as link',
		description: 'When text is selected and the clipboard holds a URL, paste it as a Markdown link [text](url). Pastes normally otherwise.',
	},
};
