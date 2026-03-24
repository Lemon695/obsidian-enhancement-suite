import type { I18nDict } from '../../locale';

interface FootnotesCommandsI18n {
	insertFootnote: { name: string };
	renumberFootnotes: { name: string };
	cleanOrphanFootnotes: { name: string };
	insertedNotice: (n: number) => string;
	renumberedNotice: (n: number) => string;
	cleanedNotice: (n: number) => string;
	noEditorNotice: string;
}

export const footnotesCommandsI18n: I18nDict<FootnotesCommandsI18n> = {
	zh: {
		insertFootnote: { name: '脚注：在光标处插入脚注' },
		renumberFootnotes: { name: '脚注：整理脚注编号' },
		cleanOrphanFootnotes: { name: '脚注：清理孤立脚注定义' },
		insertedNotice: (n) => `已插入脚注 [^${n}]`,
		renumberedNotice: (n) => `已重新编号 ${n} 个脚注`,
		cleanedNotice: (n) => `已删除 ${n} 个孤立脚注定义`,
		noEditorNotice: '没有活跃的编辑器。',
	},
	en: {
		insertFootnote: { name: 'Footnote: Insert footnote at cursor' },
		renumberFootnotes: { name: 'Footnote: Renumber all footnotes' },
		cleanOrphanFootnotes: { name: 'Footnote: Clean orphan footnote definitions' },
		insertedNotice: (n) => `Inserted footnote [^${n}]`,
		renumberedNotice: (n) => `Renumbered ${n} footnote${n === 1 ? '' : 's'}`,
		cleanedNotice: (n) =>
			`Removed ${n} orphan footnote definition${n === 1 ? '' : 's'}`,
		noEditorNotice: 'No active editor.',
	},
};
