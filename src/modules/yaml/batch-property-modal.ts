import { App, Modal, Notice, Setting, TFile } from 'obsidian';
import { t } from '../../i18n/locale';
import { batchPropertyI18n } from '../../i18n/modules/yaml/batch-property';

type BatchOperation = 'set' | 'append' | 'delete';
type BatchScope = 'folder' | 'vault';

/**
 * YAML 属性批量编辑对话框。
 *
 * 允许用户在当前文件夹或整个 Vault 范围内，对所有 Markdown 文件的 frontmatter
 * 执行以下操作：
 *   - 设置（set）：将指定 key 的值设为给定字符串
 *   - 追加（append）：若值为数组则 push；否则覆盖为新值
 *   - 删除（delete）：移除指定 key
 *
 * 使用 app.fileManager.processFrontMatter() 确保操作原子性，
 * 与其他 Obsidian 组件安全共存。
 */
export class BatchPropertyModal extends Modal {
	private key = '';
	private value = '';
	private operation: BatchOperation = 'set';
	private batchScope: BatchScope = 'folder';

	private valueSetting!: Setting;
	private previewEl!: HTMLElement;

	constructor(
		app: App,
		private readonly activeFile: TFile | null
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		const i18n = t(batchPropertyI18n);

		this.titleEl.setText(i18n.title);
		contentEl.addClass('es-batch-property-modal');

		// --- 属性名 ---
		new Setting(contentEl)
			.setName(i18n.keyLabel)
			.addText((text) =>
				text.setPlaceholder(i18n.keyPlaceholder).onChange((value) => {
					this.key = value.trim();
					this.updatePreview();
				})
			);

		// --- 操作 ---
		new Setting(contentEl)
			.setName(i18n.operationLabel)
			.addDropdown((dd) =>
				dd
					.addOption('set', i18n.opSet)
					.addOption('append', i18n.opAppend)
					.addOption('delete', i18n.opDelete)
					.setValue(this.operation)
					.onChange((value) => {
						this.operation = value as BatchOperation;
						this.updateValueVisibility();
						this.updatePreview();
					})
			);

		// --- 属性值（删除操作时隐藏）---
		this.valueSetting = new Setting(contentEl)
			.setName(i18n.valueLabel)
			.addText((text) =>
				text.setPlaceholder(i18n.valuePlaceholder).onChange((value) => {
					this.value = value;
				})
			);

		// --- 搜索范围 ---
		new Setting(contentEl)
			.setName(i18n.scopeLabel)
			.addDropdown((dd) =>
				dd
					.addOption('folder', i18n.scopeFolder)
					.addOption('vault', i18n.scopeVault)
					.setValue(this.batchScope)
					.onChange((value) => {
						this.batchScope = value as BatchScope;
						this.updatePreview();
					})
			);

		// --- 预览行：将修改 N 个文件 ---
		this.previewEl = contentEl.createDiv({ cls: 'es-batch-preview' });

		// --- 按钮 ---
		new Setting(contentEl)
			.addButton((btn) =>
				btn.setButtonText(i18n.cancelBtn).onClick(() => this.close())
			)
			.addButton((btn) =>
				btn
					.setButtonText(i18n.applyBtn)
					.setCta()
					.onClick(() => {
						this.apply().catch(console.error);
					})
			);

		this.updatePreview();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	// ---------------------------------------------------------------------------
	// 私有方法
	// ---------------------------------------------------------------------------

	/** 删除操作时隐藏属性值输入框。 */
	private updateValueVisibility(): void {
		this.valueSetting.settingEl.style.display =
			this.operation === 'delete' ? 'none' : '';
	}

	/** 更新预览文字（将修改 N 个文件）。 */
	private updatePreview(): void {
		const i18n = t(batchPropertyI18n);
		const files = this.getFilesForScope();
		this.previewEl.setText(i18n.previewLabel(files.length));
	}

	/** 根据当前 scope 获取待处理文件列表。 */
	private getFilesForScope(): TFile[] {
		const allFiles = this.app.vault.getMarkdownFiles();
		if (this.batchScope === 'vault') return allFiles;

		// folder scope：仅处理与当前活跃文件同一目录下的文件
		if (!this.activeFile) return [];
		const folderPath = this.activeFile.parent?.path ?? '/';
		return allFiles.filter((f) => f.parent?.path === folderPath);
	}

	/** 执行批量修改操作。 */
	private async apply(): Promise<void> {
		const i18n = t(batchPropertyI18n);

		if (!this.key) {
			new Notice(i18n.noKeyNotice);
			return;
		}

		const files = this.getFilesForScope();
		if (files.length === 0) {
			new Notice(i18n.noFilesNotice);
			return;
		}

		const opLabel =
			this.operation === 'set'
				? i18n.opSet
				: this.operation === 'append'
					? i18n.opAppend
					: i18n.opDelete;

		if (!window.confirm(i18n.confirmMsg(files.length, opLabel, this.key))) return;

		// 捕获局部变量，避免异步过程中 this 属性被更改
		const key = this.key;
		const value = this.value;
		const operation = this.operation;
		let modifiedCount = 0;

		for (const file of files) {
			try {
				await this.app.fileManager.processFrontMatter(file, (fm) => {
					const rec = fm as Record<string, unknown>;
					if (operation === 'set') {
						rec[key] = value;
						modifiedCount++;
					} else if (operation === 'append') {
						const existing = rec[key];
						if (Array.isArray(existing)) {
							existing.push(value);
						} else {
							rec[key] = value;
						}
						modifiedCount++;
					} else {
						// delete
						if (Reflect.has(rec, key)) {
							Reflect.deleteProperty(rec, key);
							modifiedCount++;
						}
					}
				});
			} catch (e) {
				console.error('[enhancement-suite] BatchProperty processFrontMatter error:', e);
			}
		}

		new Notice(i18n.doneNotice(modifiedCount));
		this.close();
	}
}
