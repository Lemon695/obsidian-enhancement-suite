import { App, Editor, FuzzySuggestModal } from 'obsidian';
import type { PluginModule } from '../../core/types';
import type EnhancementSuitePlugin from '../../main';
import { t } from '../../i18n/locale';
import { calloutModuleI18n } from '../../i18n/modules/callout/module';
import { calloutCommandsI18n } from '../../i18n/modules/callout/commands';

/** Obsidian 内置的 callout 类型列表（含别名展示）。 */
const CALLOUT_TYPES: ReadonlyArray<{ type: string; aliases: string }> = [
	{ type: 'note',     aliases: 'note' },
	{ type: 'abstract', aliases: 'abstract / summary / tldr' },
	{ type: 'info',     aliases: 'info' },
	{ type: 'todo',     aliases: 'todo' },
	{ type: 'tip',      aliases: 'tip / hint / important' },
	{ type: 'success',  aliases: 'success / check / done' },
	{ type: 'question', aliases: 'question / help / faq' },
	{ type: 'warning',  aliases: 'warning / caution / attention' },
	{ type: 'failure',  aliases: 'failure / fail / missing' },
	{ type: 'danger',   aliases: 'danger / error' },
	{ type: 'bug',      aliases: 'bug' },
	{ type: 'example',  aliases: 'example' },
	{ type: 'quote',    aliases: 'quote / cite' },
];

type CalloutItem = (typeof CALLOUT_TYPES)[number];

/**
 * Callout 类型选择器（FuzzySuggestModal）。
 * 用户通过模糊搜索选取 callout 类型后，回调 onChoose。
 */
class CalloutPickerModal extends FuzzySuggestModal<CalloutItem> {
	constructor(
		app: App,
		private readonly placeholder: string,
		private readonly onChoose: (item: CalloutItem) => void
	) {
		super(app);
		this.setPlaceholder(placeholder);
	}

	getItems(): CalloutItem[] {
		return [...CALLOUT_TYPES];
	}

	getItemText(item: CalloutItem): string {
		// 同时暴露 type 和 aliases，使模糊搜索两者皆可命中
		return `${item.type}  ${item.aliases}`;
	}

	onChooseItem(item: CalloutItem, _evt: MouseEvent | KeyboardEvent): void {
		this.onChoose(item);
	}
}

/**
 * Callout Tools Module — Callout 工具模块
 *
 * 功能：
 *   - 提供「插入 Callout 块」命令
 *   - 通过 FuzzySuggestModal 模糊搜索 13 种内置 callout 类型
 *   - 在光标位置插入标准格式的 callout 块
 *
 * 设计说明：
 *   - Commands 由 Obsidian 在插件卸载时自动清理
 *
 * 设置存储路径：plugin.settings.callout（暂无独立设置项）
 */
export class CalloutModule implements PluginModule {
	readonly id = 'callout';
	readonly name = t(calloutModuleI18n).name;
	readonly description = t(calloutModuleI18n).description;

	constructor(private readonly plugin: EnhancementSuitePlugin) {}

	onload(): void {
		const i18n = t(calloutCommandsI18n);

		this.plugin.addCommand({
			id: 'callout-insert',
			name: i18n.insertCallout.name,
			editorCallback: (editor: Editor) => {
				this.openCalloutPicker(editor);
			},
		});
	}

	onunload(): void {
		// Commands 由 Obsidian 自动清理
	}

	// ---------------------------------------------------------------------------
	// 私有方法
	// ---------------------------------------------------------------------------

	/** 打开 callout 类型选择器；用户确认后在光标处插入 callout 块。 */
	private openCalloutPicker(editor: Editor): void {
		const i18n = t(calloutCommandsI18n);

		const modal = new CalloutPickerModal(
			this.plugin.app,
			i18n.modalPlaceholder,
			(item) => {
				this.insertCallout(editor, item.type, i18n.defaultTitle, i18n.defaultContent);
			}
		);
		modal.open();
	}

	/**
	 * 在光标处插入 callout 块，格式如下：
	 * ```
	 * > [!type] 标题
	 * > 内容
	 * ```
	 * 插入后将光标移动到标题末尾，方便用户直接编辑。
	 */
	private insertCallout(
		editor: Editor,
		type: string,
		title: string,
		content: string
	): void {
		const cursor = editor.getCursor();
		const block = `> [!${type}] ${title}\n> ${content}\n`;
		editor.replaceRange(block, cursor);

		// 将光标定位到标题末尾（第一行末）
		const titleLine = `> [!${type}] ${title}`;
		editor.setCursor({ line: cursor.line, ch: titleLine.length });
	}
}
