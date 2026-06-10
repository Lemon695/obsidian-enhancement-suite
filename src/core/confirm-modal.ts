import { App, Modal, Setting } from 'obsidian';

export interface ConfirmOptions {
	/** 对话框标题。 */
	title: string;
	/** 提示正文（通常是「不可撤销」之类的警告）。 */
	message: string;
	/** 确认按钮文字。 */
	confirmText: string;
	/** 取消按钮文字。 */
	cancelText: string;
	/** 确认按钮是否使用警示样式（破坏性操作建议为 true）。 */
	warning?: boolean;
}

/**
 * 通用确认对话框，替代 `window.confirm()`。
 *
 * 为什么不用 window.confirm：Obsidian 审核规则禁止 `no-alert`（confirm/alert/prompt），
 * 且原生对话框不随主题、阻塞渲染线程。
 *
 * @returns Promise<boolean> — true = 用户确认；false = 取消或直接关闭。
 */
export function confirmModal(app: App, options: ConfirmOptions): Promise<boolean> {
	return new Promise((resolve) => {
		new ConfirmModal(app, options, resolve).open();
	});
}

class ConfirmModal extends Modal {
	private resolved = false;

	constructor(
		app: App,
		private readonly options: ConfirmOptions,
		private readonly resolveResult: (value: boolean) => void
	) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText(this.options.title);
		this.contentEl.createEl('p', { text: this.options.message });

		new Setting(this.contentEl)
			.addButton((btn) =>
				btn.setButtonText(this.options.cancelText).onClick(() => this.finish(false))
			)
			.addButton((btn) => {
				btn.setButtonText(this.options.confirmText).onClick(() => this.finish(true));
				if (this.options.warning) btn.buttonEl.addClass('mod-warning');
				else btn.setCta();
			});
	}

	onClose(): void {
		this.contentEl.empty();
		// 未点任何按钮直接关闭（Esc / 点遮罩）视为取消
		this.finish(false);
	}

	/** 仅结算一次：上报结果并关闭。 */
	private finish(value: boolean): void {
		if (this.resolved) return;
		this.resolved = true;
		this.resolveResult(value);
		this.close();
	}
}
