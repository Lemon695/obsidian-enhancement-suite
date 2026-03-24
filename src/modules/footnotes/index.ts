import { Editor, Notice } from 'obsidian';
import type { PluginModule } from '../../core/types';
import type EnhancementSuitePlugin from '../../main';
import { t } from '../../i18n/locale';
import { footnotesModuleI18n } from '../../i18n/modules/footnotes/module';
import { footnotesCommandsI18n } from '../../i18n/modules/footnotes/commands';

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
		const content = editor.getValue();

		// 收集已有的数字编号
		const usedNums = new Set<number>();
		const numPattern = /\[\^(\d+)\]/g;
		let m: RegExpExecArray | null;
		while ((m = numPattern.exec(content)) !== null) {
			usedNums.add(parseInt(m[1] ?? '0', 10));
		}

		// 找最小未使用编号
		let nextN = 1;
		while (usedNums.has(nextN)) nextN++;

		// 在光标位置插入引用
		const cursor = editor.getCursor();
		const ref = `[^${nextN}]`;
		editor.replaceRange(ref, cursor);

		// 在文末追加定义（确保前有换行）
		const newContent = editor.getValue();
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
		let content = editor.getValue();

		// 收集引用标签（按首次出现顺序，排除定义行）
		const labelOrder: string[] = [];
		const seenLabels = new Set<string>();
		const scanPattern = /\[\^([^\]]+)\](:?)/g;
		let m: RegExpExecArray | null;

		while ((m = scanPattern.exec(content)) !== null) {
			const label = m[1] ?? '';
			const isDefinition = m[2] === ':';
			if (!isDefinition && !seenLabels.has(label)) {
				seenLabels.add(label);
				labelOrder.push(label);
			}
		}

		if (labelOrder.length === 0) {
			new Notice(i18n.renumberedNotice(0));
			return;
		}

		// 建立重命名映射
		const renameMap = new Map<string, string>(
			labelOrder.map((label, idx) => [label, String(idx + 1)])
		);

		// 阶段 1：替换为唯一占位符（按标签长度降序，防止短标签误匹配长标签前缀）
		const sortedLabels = [...renameMap.keys()].sort((a, b) => b.length - a.length);
		const placeholders = new Map<string, string>();

		sortedLabels.forEach((label, i) => {
			placeholders.set(label, `__FNPH${i}__`);
		});

		for (const label of sortedLabels) {
			const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const ph = placeholders.get(label) ?? '';
			content = content.replace(new RegExp(`\\[\\^${escaped}\\]`, 'g'), `[^${ph}]`);
		}

		// 阶段 2：将占位符替换为最终编号
		for (const [label, ph] of placeholders.entries()) {
			const newNum = renameMap.get(label) ?? label;
			const escapedPh = ph.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			content = content.replace(new RegExp(`\\[\\^${escapedPh}\\]`, 'g'), `[^${newNum}]`);
		}

		editor.setValue(content);
		new Notice(i18n.renumberedNotice(labelOrder.length));
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
		const content = editor.getValue();

		// 收集所有被引用的标签（排除定义行自身）
		const usedLabels = new Set<string>();
		const scanPattern = /\[\^([^\]]+)\](:?)/g;
		let m: RegExpExecArray | null;

		while ((m = scanPattern.exec(content)) !== null) {
			const label = m[1] ?? '';
			const isDefinition = m[2] === ':';
			if (!isDefinition) {
				usedLabels.add(label);
			}
		}

		// 过滤掉孤立定义行
		const lines = content.split('\n');
		const cleanedLines: string[] = [];
		let removedCount = 0;

		for (const line of lines) {
			const defMatch = /^\[\^([^\]]+)\]:/.exec(line);
			if (defMatch) {
				const label = defMatch[1] ?? '';
				if (!usedLabels.has(label)) {
					removedCount++;
					continue; // 跳过孤立定义行
				}
			}
			cleanedLines.push(line);
		}

		if (removedCount > 0) {
			editor.setValue(cleanedLines.join('\n'));
		}

		new Notice(i18n.cleanedNotice(removedCount));
	}
}
