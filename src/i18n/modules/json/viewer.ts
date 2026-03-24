import type { I18nDict } from '../../locale';

interface JsonViewerUiI18n {
	/** 工具栏：树形模式切换按钮 */
	treeView: string;
	/** 工具栏：源码模式切换按钮 */
	sourceView: string;
	/** 工具栏：格式化按钮 */
	format: string;
	/** 状态指示：JSON 有效 */
	valid: string;
	/** 状态指示：JSON 无效 */
	invalid: string;
	/** 代码块增强按钮文字 */
	openInViewer: string;
	/** 代码块内容解析失败时的 Notice 前缀 */
	invalidJson: string;
	/** 状态栏：键数与深度统计 */
	stats: (keys: number, depth: number) => string;
	/** 状态栏：文件大小 */
	fileSizeBytes: (bytes: number) => string;
}

export const jsonViewerUiI18n: I18nDict<JsonViewerUiI18n> = {
	zh: {
		treeView: '树形视图',
		sourceView: '源码视图',
		format: '格式化',
		valid: '✓ 有效',
		invalid: '✗ 无效',
		openInViewer: '查看 JSON',
		invalidJson: '无效的 JSON',
		stats: (keys, depth) => `${keys} 个键 · 深度 ${depth}`,
		fileSizeBytes: (bytes) =>
			bytes < 1024
				? `${bytes} B`
				: `${(bytes / 1024).toFixed(1)} KB`,
	},
	en: {
		treeView: 'Tree view',
		sourceView: 'Source view',
		format: 'Format',
		valid: '✓ Valid',
		invalid: '✗ Invalid',
		openInViewer: 'View JSON',
		invalidJson: 'Invalid JSON',
		stats: (keys, depth) => `${keys} keys · Depth ${depth}`,
		fileSizeBytes: (bytes) =>
			bytes < 1024
				? `${bytes} B`
				: `${(bytes / 1024).toFixed(1)} KB`,
	},
};
