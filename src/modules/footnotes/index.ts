import { Editor, Notice } from 'obsidian';
import type { PluginModule } from '../../core/types';
import type EnhancementSuitePlugin from '../../main';
import { t } from '../../i18n/locale';
import { footnotesModuleI18n } from '../../i18n/modules/footnotes/module';
import { footnotesCommandsI18n } from '../../i18n/modules/footnotes/commands';
import {
	pickNextFootnoteNumber,
	renumberFootnotes as renumberFootnotesContent,
	removeOrphanFootnoteDefs,
} from './footnotes-ops';

/**
 * Footnotes Enhancement Module — 脚注工具模块
 *
 * 提供三个命令：
 *   1. 在光标处插入脚注（自动分配编号，在文末追加定义行）
 *   2. 整理脚注编号（按首次出现顺序重编为 1, 2, 3…）
 *   3. 清理孤立脚注定义（有定义无引用的 [^n]: 行）
 *
 * 设计说明：
 *   - 所有命令通过 editor.getValue() / editor.setValue() 操作
 *   - 编号整理使用两阶段替换（占位符 → 最终编号），避免互相覆盖
 *   - Commands 由 Obsidian 在插件卸载时自动清理
 *
 * 设置存储路径：plugin.settings.footnotes（暂无独立设置项）
 */
export class FootnotesModule implements PluginModule {
	readonly id = 'footnotes';
	readonly name = t(footnotesModuleI18n).name;
	readonly description = t(footnotesModuleI18n).description;

	constructor(private readonly plugin: EnhancementSuitePlugin) {}

	onload(): void {
		this.registerCommands();
	}

	onunload(): void {
		// Commands 由 Obsidian 自动清理，无需手动处理
	}

	// ---------------------------------------------------------------------------
	// 命令注册
	// ---------------------------------------------------------------------------

	private registerCommands(): void {
		const i18n = t(footnotesCommandsI18n);

		// 1. 插入脚注
		this.plugin.addCommand({
			id: 'footnote-insert',
			name: i18n.insertFootnote.name,
			editorCallback: (editor: Editor) => {
				this.insertFootnote(editor);
			},
		});

		// 2. 整理脚注编号
		this.plugin.addCommand({
			id: 'footnote-renumber',
			name: i18n.renumberFootnotes.name,
			editorCallback: (editor: Editor) => {
				this.renumberFootnotes(editor);
			},
		});

		// 3. 清理孤立脚注定义
		this.plugin.addCommand({
			id: 'footnote-clean-orphans',
			name: i18n.cleanOrphanFootnotes.name,
			editorCallback: (editor: Editor) => {
				this.cleanOrphanFootnotes(editor);
			},
		});
	}

	// ---------------------------------------------------------------------------
	// 命令实现
	// ---------------------------------------------------------------------------

	/**
	 * 在光标处插入 [^n]，并在文件末尾追加 [^n]: 定义行。
	 * 编号自动选取当前文档中最小的未使用正整数。
	 */
	private insertFootnote(editor: Editor): void {
		const i18n = t(footnotesCommandsI18n);
		const nextN = pickNextFootnoteNumber(editor.getValue());

		// 在光标位置插入引用
		const cursor = editor.getCursor();
		const ref = `[^${nextN}]`;
		editor.replaceRange(ref, cursor);

		// 在文末追加定义（确保前有换行）
		const lastLine = editor.lineCount() - 1;
		const lastLineText = editor.getLine(lastLine);
		const needsNewline = lastLineText.length > 0;
		const defLine = `${needsNewline ? '\n' : ''}\n[^${nextN}]: `;
		editor.replaceRange(defLine, { line: lastLine, ch: lastLineText.length });

		// 移动光标到引用之后
		editor.setCursor({ line: cursor.line, ch: cursor.ch + ref.length });

		new Notice(i18n.insertedNotice(nextN));
	}

	/**
	 * 按文档中引用的首次出现顺序，将所有脚注重编为 1, 2, 3, ...
	 *
	 * 算法：
	 *   1. 扫描所有 [^label]（跳过定义行），收集有序标签列表
	 *   2. 建立 oldLabel → newNum 映射
	 *   3. 两阶段替换：先换成唯一占位符，再换成最终编号
	 *      （避免 "1→2, 2→1" 这类互相覆盖问题）
	 */
	private renumberFootnotes(editor: Editor): void {
		const i18n = t(footnotesCommandsI18n);
		const { content, count } = renumberFootnotesContent(editor.getValue());
		if (count > 0) this.applyContent(editor, content);
		new Notice(i18n.renumberedNotice(count));
	}

	/**
	 * 删除没有对应引用的脚注定义行（[^label]: ...）。
	 *
	 * 判断方式：
	 *   - 定义行：行首为 [^label]:
	 *   - 引用：文档中其他位置出现 [^label]（非定义行）
	 */
	private cleanOrphanFootnotes(editor: Editor): void {
		const i18n = t(footnotesCommandsI18n);
		const { content, removed } = removeOrphanFootnoteDefs(editor.getValue());
		if (removed > 0) this.applyContent(editor, content);
		new Notice(i18n.cleanedNotice(removed));
	}

	/**
	 * 用新内容整体替换编辑器，并尽量保留光标位置与滚动状态。
	 *
	 * 为什么不直接 `editor.setValue()`：setValue 会把光标重置到文档开头、
	 * 丢失滚动位置（重编号/清理脚注是「整篇变换」，但用户视觉焦点应保持）。
	 * 这里先快照光标与滚动，setValue 后再把光标钳制到合法范围并恢复滚动。
	 */
	private applyContent(editor: Editor, newContent: string): void {
		if (editor.getValue() === newContent) return;

		const cursor = editor.getCursor();
		const scroll = editor.getScrollInfo();

		editor.setValue(newContent);

		const lastLine = Math.max(0, editor.lineCount() - 1);
		const line = Math.min(cursor.line, lastLine);
		const ch = Math.min(cursor.ch, editor.getLine(line).length);
		editor.setCursor({ line, ch });
		editor.scrollTo(scroll.left, scroll.top);
	}
}
