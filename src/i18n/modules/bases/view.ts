import type { I18nDict } from '../../locale';

export interface BasesViewI18n {
	/** Name shown in the Bases view-type selector. */
	viewName: string;
	/** Tooltip / text on the "Copy as Markdown" button. */
	copyBtn: string;
	/** Brief confirmation text shown after a successful copy. */
	copied: string;
	/** Console / debug note when Bases is not enabled. */
	basesDisabled: string;
}

export const basesViewI18n: I18nDict<BasesViewI18n> = {
	zh: {
		viewName: 'Markdown 表格',
		copyBtn: '复制为 Markdown',
		copied: '已复制！',
		basesDisabled: 'Bases 核心插件未启用，跳过自定义视图注册。',
	},
	en: {
		viewName: 'Markdown Table',
		copyBtn: 'Copy as Markdown',
		copied: 'Copied!',
		basesDisabled: 'Bases core plugin is disabled; skipping custom view registration.',
	},
};
