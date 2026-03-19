import type { I18nDict } from '../../locale';

interface JsonViewerI18n {
	/** Label on the copy button in the modal footer. */
	copyBtn: string;
	/** Label shown after a successful copy. */
	copied: string;
	/** Notice shown when clipboard write fails. */
	copyFailed: string;
	/** aria-label / tooltip when the node is expanded (button will collapse). */
	collapse: string;
	/** aria-label / tooltip when the node is collapsed (button will expand). */
	expand: string;
	/** title attribute on a truncated long string (click to show full). */
	clickToExpand: string;
	/** title attribute on an expanded long string (click to truncate). */
	clickToCollapse: string;
	/** Context-menu item title for copying JSON from the Properties panel. */
	copyMenuTitle: string;
}

export const jsonViewerI18n: I18nDict<JsonViewerI18n> = {
	zh: {
		copyBtn: '复制 JSON',
		copied: '已复制',
		copyFailed: '复制失败，请手动复制。',
		collapse: '折叠',
		expand: '展开',
		clickToExpand: '点击展开完整内容',
		clickToCollapse: '点击折叠',
		copyMenuTitle: '复制 JSON',
	},
	en: {
		copyBtn: 'Copy JSON',
		copied: 'Copied',
		copyFailed: 'Copy failed. Please copy manually.',
		collapse: 'Collapse',
		expand: 'Expand',
		clickToExpand: 'Click to expand',
		clickToCollapse: 'Click to collapse',
		copyMenuTitle: 'Copy JSON',
	},
};
