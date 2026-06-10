import { App, Modal, Notice, TFile } from 'obsidian';
import { t } from '../../i18n/locale';
import { renameModalI18n } from '../../i18n/modules/rename/modal';
import { applyPattern, formatDate, formatTimestamp, validateFilename } from './rename-patterns';
import { PatternPickerTable } from './pattern-picker-table';

/**
 * QuickRenameModal — single-file rename via a scrollable pattern-picker table.
 *
 * Layout:
 *   ┌─ title: 快速重命名 ────────────────────────────────────────┐
 *   │  当前文件名：note.md                                        │
 *   ├─ pattern picker table (scrollable, max-height: 420px) ───┤
 *   │  ▶  日期前缀    [前缀]  2026-03-29——note.md               │
 *   │     时间戳前缀  [前缀]  20260329120000——note.md            │
 *   │     ...                                                    │
 *   ├─ buttons ─────────────────────────────────────────────────┤
 *   │  [取消]                           [确认重命名]             │
 *   └───────────────────────────────────────────────────────────┘
 *
 * Keyboard navigation: ↑/↓ to move, Enter to confirm, Escape to close.
 *
 * @param onRename  Optional callback fired after a successful rename (e.g. to refresh a parent view).
 */
export class QuickRenameModal extends Modal {
	private readonly i18n = t(renameModalI18n);
	private pickerTable!: PatternPickerTable;
	private nameInput!: HTMLInputElement;
	private nameError!: HTMLSpanElement;
	private confirmBtn!: HTMLButtonElement;

	// Pre-generated stable values reused across pattern previews
	private readonly sessionDate      = formatDate();
	private readonly sessionTimestamp = formatTimestamp();
	private readonly sessionUuid      = crypto.randomUUID();

	constructor(
		app: App,
		private readonly file: TFile,
		private readonly onRename?: () => void,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl, i18n } = this;

		// Widen the modal
		this.modalEl.addClass('es-rename-modal-large');
		contentEl.addClass('es-rename-modal');

		this.titleEl.setText(i18n.title);

		// --- Current filename display ---
		const fileBar = contentEl.createDiv({ cls: 'es-rename-modal-file-bar' });
		fileBar.createEl('span', { cls: 'es-rename-modal-file-label', text: i18n.currentName + '：' });
		fileBar.createEl('span', {
			cls: 'es-rename-modal-file-name',
			text: this.file.extension ? `${this.file.basename}.${this.file.extension}` : this.file.basename,
		});

		// --- Editable new name bar ---
		const nameBar = contentEl.createDiv({ cls: 'es-rename-name-bar' });
		nameBar.createEl('span', { cls: 'es-rename-name-label', text: i18n.newNameLabel + '：' });
		this.nameInput = nameBar.createEl('input', {
			type: 'text',
			cls: 'es-rename-name-input',
		});
		this.nameError = nameBar.createEl('span', { cls: 'es-rename-name-error' });

		this.nameInput.addEventListener('input', () => this.validateName());

		// --- Pattern picker table ---
		this.pickerTable = new PatternPickerTable(
			this.file.basename,
			this.file.extension,
			{
				patterns:          i18n.patterns,
				typePrefix:        i18n.typePrefix,
				typeSuffix:        i18n.typeSuffix,
				typeReplace:       i18n.typeReplace,
				customPlaceholder: i18n.customPlaceholder,
			},
		);
		this.pickerTable.render(contentEl, 'date-uuid-replace');
		this.pickerTable.setOnChange(() => this.syncNameFromPattern());

		// --- Action buttons ---
		const btnBar = contentEl.createDiv({ cls: 'es-rename-modal-btn-bar' });

		btnBar.createEl('button', { text: i18n.cancelBtn, cls: 'es-rename-modal-cancel' })
			.addEventListener('click', () => this.close());

		this.confirmBtn = btnBar.createEl('button', {
			text: i18n.confirmBtn,
			cls: 'mod-cta es-rename-modal-confirm',
		});
		this.confirmBtn.addEventListener('click', () => void this.doRename());

		// Initialise name input with default pattern (must be after confirmBtn is created)
		this.syncNameFromPattern();

		// --- Keyboard navigation ---
		this.scope.register([], 'ArrowDown', (e) => {
			e.preventDefault();
			this.pickerTable.selectNext();
		});
		this.scope.register([], 'ArrowUp', (e) => {
			e.preventDefault();
			this.pickerTable.selectPrev();
		});
		this.scope.register([], 'Enter', () => {
			void this.doRename();
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}

	// ----------------------------------------------------------------

	/** Overwrites the name input with the currently selected pattern's preview. */
	private syncNameFromPattern(): void {
		const pattern    = this.pickerTable.getPattern();
		const customText = this.pickerTable.getCustomText();
		const preview = applyPattern(this.file.basename, this.file.extension, pattern, {
			date:      this.sessionDate,
			timestamp: this.sessionTimestamp,
			uuid:      this.sessionUuid,
			customText,
		});
		this.nameInput.value = preview;
		this.validateName();
	}

	/** Validates the current name input; toggles error message and confirm button state. */
	private validateName(): void {
		const result = validateFilename(this.nameInput.value.trim());
		if (result.valid) {
			this.nameInput.removeClass('is-invalid');
			this.nameError.setText('');
			this.confirmBtn.disabled = false;
		} else {
			this.nameInput.addClass('is-invalid');
			this.nameError.setText(this.i18n.invalidFilenameError);
			this.confirmBtn.disabled = true;
		}
	}

	private async doRename(): Promise<void> {
		const { i18n } = this;
		const newName = this.nameInput.value.trim();

		const check = validateFilename(newName);
		if (!check.valid) return;

		const dir     = this.file.parent ? this.file.parent.path : '';
		const newPath = dir ? `${dir}/${newName}` : newName;

		try {
			await this.app.fileManager.renameFile(this.file, newPath);
			new Notice(i18n.renameSuccess(newName));
			this.close();
			this.onRename?.();
		} catch (err) {
			console.error('[enhancement-suite] QuickRenameModal rename failed:', err);
			new Notice(i18n.renameFailed);
		}
	}
}
