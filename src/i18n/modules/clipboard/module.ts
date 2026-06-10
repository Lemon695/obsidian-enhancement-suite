import type { I18nDict } from '../../locale';

interface ClipboardModuleI18n {
	name: string;
	description: string;
}

export const clipboardModuleI18n: I18nDict<ClipboardModuleI18n> = {
	zh: {
		name: '剪贴板工具',
		description: '快速将当前笔记内容复制到剪贴板，支持完整内容、去除 frontmatter 或仅复制 frontmatter。',
	},
	en: {
		name: 'Clipboard Tools',
		description: 'Copy current note content to clipboard: full content, without frontmatter, or frontmatter only.',
	},
};
