import { App, Modal } from 'obsidian';
import { t } from '../../i18n/locale';
import { renameModalI18n } from '../../i18n/modules/rename/modal';
import { applyPattern, formatDate, formatTimestamp, resolveNameConflict, type FileRecord, type RenamePattern } from './rename-patterns';
import { PatternPickerTable } from './pattern-picker-table';

const MAX_PREVIEW_FILES = 5;

/**
 * BatchRenameConfirmModal — pattern selector + live file preview for bulk rename.
 *
 * Layout:
 *   ┌─ title: 批量重命名 N 个文件 ──────────────────────────────┐
 *   ├─ pattern picker table ────────────────────────────────────┤
 *   │  ▶  日期前缀   [前缀]   2026-03-29——note.md              │
 *   │     ...                                                    │
 *   ├─ file preview (first 5) ──────────────────────────────────┤
 *   │  note.md  →  2026-03-29——note.md                         │
 *   │  img.png  →  2026-03-29——img.png                         │
 *   │  ……另有 12 个文件                                         │
 *   ├─ buttons ─────────────────────────────────────────────────┤
 *   │  [取消]                    [确认重命名 N 个文件]           │
 *   └───────────────────────────────────────────────────────────┘
 */
export class BatchRenameConfirmModal extends Modal {
	private readonly i18n = t(renameModalI18n);
	private pickerTable!: PatternPickerTable;
	private previewListEl!: HTMLElement;

	// Stable values pre-generated once per modal open (consistent previews)
	private readonly previewDate      = formatDate();
	private readonly previewTimestamp = formatTimestamp();
	// One UUID per preview file so uuid-replace shows distinct values
	private readonly previewUuids     = Array.from({ length: MAX_PREVIEW_FILES }, () => crypto.randomUUID());

	constructor(
		app: App,
		private readonly selectedFiles: FileRecord[],
		private readonly onConfirm: (pattern: RenamePattern, customText: string) => void,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl, i18n } = this;

		this.modalEl.addClass('es-rename-modal-large');
		this.titleEl.setText(i18n.batchConfirmTitle(this.selectedFiles.length));
		contentEl.addClass('es-rename-confirm-modal');

		// --- Pattern picker (use first file as sample for previews) ---
		const sample = this.selectedFiles[0];
		this.pickerTable = new PatternPickerTable(
			sample?.basename ?? 'filename',
			sample?.extension ?? '',
			{
				patterns:          i18n.patterns,
				typePrefix:        i18n.typePrefix,
				typeSuffix:        i18n.typeSuffix,
				typeReplace:       i18n.typeReplace,
				customPlaceholder: i18n.customPlaceholder,
			},
		);
		this.pickerTable.render(contentEl, 'date-prefix');
		this.pickerTable.setOnChange(() => this.refreshPreview());

		// --- File preview list ---
		const previewSection = contentEl.createDiv({ cls: 'es-rename-confirm-preview-section' });
		previewSection.createEl('div', {
			cls: 'es-rename-confirm-preview-label',
			text: i18n.batchConfirmPreviewLabel,
		});
		this.previewListEl = previewSection.createEl('ul', { cls: 'es-rename-confirm-preview-list' });
		this.refreshPreview();

		// --- Action buttons ---
		const btnBar = contentEl.createDiv({ cls: 'es-rename-modal-btn-bar' });

		btnBar.createEl('button', { text: i18n.cancelBtn, cls: 'es-rename-modal-cancel' })
			.addEventListener('click', () => this.close());

		btnBar.createEl('button', {
			text: i18n.batchConfirmBtn(this.selectedFiles.length),
			cls: 'mod-cta es-rename-modal-confirm',
		}).addEventListener('click', () => {
			this.onConfirm(this.pickerTable.getPattern(), this.pickerTable.getCustomText());
			this.close();
		});

		// --- Keyboard navigation ---
		this.scope.register([], 'ArrowDown', (e) => {
			e.preventDefault();
			this.pickerTable.selectNext();
		});
		this.scope.register([], 'ArrowUp', (e) => {
			e.preventDefault();
			this.pickerTable.selectPrev();
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}

	// ----------------------------------------------------------------

	private refreshPreview(): void {
		const { i18n } = this;
		const pattern    = this.pickerTable.getPattern();
		const customText = this.pickerTable.getCustomText();

		this.previewListEl.empty();

		const previewFiles = this.selectedFiles.slice(0, MAX_PREVIEW_FILES);

		// Mirror the same conflict-resolution logic used in doBulkRename
		// so the preview faithfully reflects what will happen.
		const usedNames = new Set<string>();

		previewFiles.forEach((file, idx) => {
			const rawName = applyPattern(file.basename, file.extension, pattern, {
				date:      this.previewDate,
				timestamp: this.previewTimestamp,
				uuid:      this.previewUuids[idx] ?? crypto.randomUUID(),
				customText,
			});
			const newName = resolveNameConflict(rawName, usedNames);
			usedNames.add(newName);

			const oldName = file.extension ? `${file.basename}.${file.extension}` : file.basename;
			const li = this.previewListEl.createEl('li', { cls: 'es-rename-confirm-preview-item' });
			li.createEl('span', { cls: 'es-rename-confirm-old', text: oldName });
			li.createEl('span', { cls: 'es-rename-confirm-arrow', text: ' → ' });
			li.createEl('span', { cls: 'es-rename-confirm-new', text: newName });
		});

		const remaining = this.selectedFiles.length - previewFiles.length;
		if (remaining > 0) {
			this.previewListEl.createEl('li', {
				cls: 'es-rename-confirm-preview-more',
				text: i18n.batchConfirmMoreFiles(remaining),
			});
		}
	}
}
