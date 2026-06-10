import { Notice, TFile } from 'obsidian';
import type { PluginModule } from '../../core/types';
import type EnhancementSuitePlugin from '../../main';
import { t } from '../../i18n/locale';
import { clipboardModuleI18n } from '../../i18n/modules/clipboard/module';
import { clipboardCommandsI18n } from '../../i18n/modules/clipboard/commands';
import {
	stripFrontmatter,
	extractFrontmatterBlock,
} from '../yaml/frontmatter';

/**
 * Clipboard Tools Module — 剪贴板工具模块
 *
 * 提供三个命令：
 *   1. 复制当前笔记的完整内容（含 frontmatter）
 *   2. 复制当前笔记内容，去除 YAML frontmatter（其余内容原样保留）
 *   3. 仅复制 YAML frontmatter 块（含上下两端的 `---` 分隔线）
 *
 * 设计说明：
 *   - 使用 checkCallback，在编辑模式与阅读模式下均可用
 *   - 使用 vault.cachedRead() 读取已保存的文件内容
 *   - navigator.clipboard.writeText() 写入系统剪贴板（Electron + Mobile 均支持）
 *   - Commands 由 Obsidian 在插件卸载时自动清理
 *
 * 设置存储路径：plugin.settings.clipboard（暂无独立设置项）
 */
export class ClipboardModule implements PluginModule {
	readonly id = 'clipboard';
	readonly name = t(clipboardModuleI18n).name;
	readonly description = t(clipboardModuleI18n).description;

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
		const i18n = t(clipboardCommandsI18n);

		// 1. 复制完整内容
		this.plugin.addCommand({
			id: 'clipboard-copy-full',
			name: i18n.copyFull.name,
			checkCallback: (checking: boolean) => {
				const file = this.plugin.app.workspace.getActiveFile();
				if (!file || file.extension !== 'md') return false;
				if (!checking) {
					void this.writeToClipboard(file, (content) => content);
				}
				return true;
			},
		});

		// 2. 复制去除 frontmatter 的内容
		this.plugin.addCommand({
			id: 'clipboard-copy-no-frontmatter',
			name: i18n.copyNoFrontmatter.name,
			checkCallback: (checking: boolean) => {
				const file = this.plugin.app.workspace.getActiveFile();
				if (!file || file.extension !== 'md') return false;
				if (!checking) {
					void this.writeToClipboard(file, stripFrontmatter);
				}
				return true;
			},
		});

		// 3. 仅复制 frontmatter 块
		this.plugin.addCommand({
			id: 'clipboard-copy-frontmatter-only',
			name: i18n.copyFrontmatterOnly.name,
			checkCallback: (checking: boolean) => {
				const file = this.plugin.app.workspace.getActiveFile();
				if (!file || file.extension !== 'md') return false;
				if (!checking) {
					void this.writeFrontmatterToClipboard(file);
				}
				return true;
			},
		});
	}

	// ---------------------------------------------------------------------------
	// 实现
	// ---------------------------------------------------------------------------

	/**
	 * 读取文件内容，经 transform 处理后写入剪贴板，并显示结果 Notice。
	 */
	private async writeToClipboard(
		file: TFile,
		transform: (content: string) => string
	): Promise<void> {
		const i18n = t(clipboardCommandsI18n);
		try {
			const content = await this.plugin.app.vault.cachedRead(file);
			await navigator.clipboard.writeText(transform(content));
			new Notice(i18n.copiedNotice);
		} catch {
			new Notice(i18n.copyFailedNotice);
		}
	}

	/**
	 * 提取文件的 frontmatter 块写入剪贴板。
	 * 若文件无 frontmatter，显示提示 Notice，不写入剪贴板。
	 */
	private async writeFrontmatterToClipboard(file: TFile): Promise<void> {
		const i18n = t(clipboardCommandsI18n);
		try {
			const content = await this.plugin.app.vault.cachedRead(file);
			const block = extractFrontmatterBlock(content);
			if (!block) {
				new Notice(i18n.noFrontmatterNotice);
				return;
			}
			await navigator.clipboard.writeText(block);
			new Notice(i18n.copiedNotice);
		} catch {
			new Notice(i18n.copyFailedNotice);
		}
	}
}
