import { Editor, MarkdownFileInfo, MarkdownView } from 'obsidian';
import type { PluginModule } from '../../core/types';
import type EnhancementSuitePlugin from '../../main';
import { t } from '../../i18n/locale';
import { pasteLinkModuleI18n } from '../../i18n/modules/paste-link/module';
import { buildMarkdownLink } from './paste-link';

/**
 * Paste as Link Module — 粘贴为链接模块
 *
 * 功能（方案 A，保守）：
 *   - 监听编辑器粘贴事件
 *   - 当「有选中文字」且「剪贴板是单个 URL」时，
 *     拦截默认粘贴，改为插入 `[选中文字](url)`
 *   - 其余情况完全不干预，保持 Obsidian 默认粘贴行为
 *
 * 设计说明：
 *   - 所有判断逻辑在纯函数 buildMarkdownLink 中（见 paste-link.ts，已单测）
 *   - 通过 workspace 的 'editor-paste' 事件接入；registerEvent 由 Obsidian 自动清理
 *   - 仅当确定要改写时才 preventDefault，避免影响图片/富文本等其它粘贴
 *
 * 设置存储路径：plugin.settings.pasteLink（暂无独立设置项）
 */
export class PasteLinkModule implements PluginModule {
	readonly id = 'pasteLink';
	readonly name = t(pasteLinkModuleI18n).name;
	readonly description = t(pasteLinkModuleI18n).description;

	constructor(private readonly plugin: EnhancementSuitePlugin) {}

	onload(): void {
		this.plugin.registerEvent(
			this.plugin.app.workspace.on('editor-paste', (evt, editor) =>
				this.handlePaste(evt, editor)
			)
		);
	}

	onunload(): void {
		// registerEvent 注册的监听器由 Obsidian 自动清理，无需手动处理
	}

	// ---------------------------------------------------------------------------
	// 私有方法
	// ---------------------------------------------------------------------------

	/**
	 * 处理粘贴事件。仅在满足拦截条件时改写，否则原样放行。
	 */
	private handlePaste(
		evt: ClipboardEvent,
		editor: Editor,
		_info?: MarkdownView | MarkdownFileInfo
	): void {
		// 已被其它处理器消费的事件不再处理
		if (evt.defaultPrevented) return;

		const clipboardText = evt.clipboardData?.getData('text/plain') ?? '';
		if (clipboardText.length === 0) return;

		const selectedText = editor.getSelection();
		const link = buildMarkdownLink(selectedText, clipboardText);
		if (link === null) return; // 不满足条件 → 放行默认粘贴

		evt.preventDefault();
		editor.replaceSelection(link);
	}
}
