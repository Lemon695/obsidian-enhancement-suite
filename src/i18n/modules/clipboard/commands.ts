import type { I18nDict } from '../../locale';

interface ClipboardCommandsI18n {
	copyFull: { name: string };
	copyNoFrontmatter: { name: string };
	copyFrontmatterOnly: { name: string };
	copiedNotice: string;
	copyFailedNotice: string;
	noFrontmatterNotice: string;
}

export const clipboardCommandsI18n: I18nDict<ClipboardCommandsI18n> = {
	zh: {
		copyFull: { name: '剪贴板：复制笔记完整内容' },
		copyNoFrontmatter: { name: '剪贴板：复制笔记内容（去除 frontmatter）' },
		copyFrontmatterOnly: { name: '剪贴板：仅复制 frontmatter' },
		copiedNotice: '已复制到剪贴板',
		copyFailedNotice: '复制失败',
		noFrontmatterNotice: '此文件没有 frontmatter',
	},
	en: {
		copyFull: { name: 'Clipboard: Copy note content' },
		copyNoFrontmatter: { name: 'Clipboard: Copy note content without frontmatter' },
		copyFrontmatterOnly: { name: 'Clipboard: Copy frontmatter only' },
		copiedNotice: 'Copied to clipboard',
		copyFailedNotice: 'Copy failed',
		noFrontmatterNotice: 'This file has no frontmatter',
	},
};
