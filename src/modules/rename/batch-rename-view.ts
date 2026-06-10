import { ItemView, Notice, TFile, WorkspaceLeaf } from 'obsidian';
import type EnhancementSuitePlugin from '../../main';
import { t } from '../../i18n/locale';
import { renamePanelI18n } from '../../i18n/modules/rename/panel';
import {
	applyPattern,
	filterFiles,
	formatDate,
	formatTimestamp,
	getFileTypeGroup,
	paginate,
	getTotalPages,
	resolveNameConflict,
	type FileRecord,
	type FileTypeGroup,
	type RenameFilter,
	type RenamePattern,
} from './rename-patterns';
import { QuickRenameModal } from './quick-rename-modal';
import { BatchRenameConfirmModal } from './batch-rename-confirm-modal';

export const BATCH_RENAME_VIEW_ID = 'es-batch-rename';

const PAGE_SIZE = 20;

/**
 * BatchRenameView — ItemView showing all vault files in a filterable table.
 *
 * Layout:
 *   ┌─ filter bar ──────────────────────────────────────────────┐
 *   │  [search]  [type]  [dateFrom]  [dateTo]  [clear]          │
 *   ├─ bulk action bar ─────────────────────────────────────────┤
 *   │  [全选当前页]  [取消全选]  [批量重命名 (N)]               │
 *   ├─ table ───────────────────────────────────────────────────┤
 *   │  ☐  filename  type  modified  [重命名]                     │
 *   │     → clicking [重命名] opens QuickRenameModal             │
 *   ├─ pagination ──────────────────────────────────────────────┤
 *   └───────────────────────────────────────────────────────────┘
 */
export class BatchRenameView extends ItemView {
	private readonly i18n = t(renamePanelI18n);

	private filter: RenameFilter = { search: '', typeGroups: [], dateFrom: null, dateTo: null };
	private currentPage = 1;
	private allFiles: FileRecord[] = [];
	private filteredFiles: FileRecord[] = [];
	private selectedPaths = new Set<string>();

	private tableBodyEl!: HTMLElement;
	private paginationEl!: HTMLElement;
	private bulkCountEl!: HTMLButtonElement;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: EnhancementSuitePlugin,
	) {
		super(leaf);
	}

	getViewType(): string { return BATCH_RENAME_VIEW_ID; }
	getDisplayText(): string { return this.i18n.title; }
	getIcon(): string { return 'pencil'; }

	async onOpen(): Promise<void> {
		const { contentEl, i18n } = this;
		contentEl.addClass('es-batch-rename-view');

		this.loadFiles();
		this.buildFilterBar(contentEl, i18n);
		this.buildBulkBar(contentEl, i18n);
		this.buildTable(contentEl, i18n);
		this.buildPagination(contentEl, i18n);
		this.renderTable();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	// ----------------------------------------------------------------
	// Data loading
	// ----------------------------------------------------------------

	private loadFiles(): void {
		this.allFiles = this.plugin.app.vault.getAllLoadedFiles()
			.filter((f): f is TFile => f instanceof TFile)
			.map((f): FileRecord => ({
				path:      f.path,
				basename:  f.basename,
				extension: f.extension,
				mtimeMs:   f.stat.mtime,
				size:      f.stat.size,
			}));
		this.applyFilter();
	}

	private applyFilter(): void {
		this.filteredFiles = filterFiles(this.allFiles, this.filter);
		this.currentPage = 1;
		this.selectedPaths.clear();
	}

	// ----------------------------------------------------------------
	// Filter bar
	// ----------------------------------------------------------------

	private buildFilterBar(parent: HTMLElement, i18n: typeof this.i18n): void {
		const bar = parent.createDiv({ cls: 'es-rename-filter-bar' });

		const searchInput = bar.createEl('input', {
			type: 'text',
			cls: 'es-rename-search',
			attr: { placeholder: i18n.searchPlaceholder },
		});
		searchInput.addEventListener('input', () => {
			this.filter = { ...this.filter, search: searchInput.value };
			this.applyFilter();
			this.renderTable();
		});

		const typeSelect = bar.createEl('select', { cls: 'es-rename-type-select' });
		[
			{ value: '',         label: i18n.filterTypeAll },
			{ value: 'markdown', label: i18n.filterTypeMarkdown },
			{ value: 'image',    label: i18n.filterTypeImage },
			{ value: 'video',    label: i18n.filterTypeVideo },
			{ value: 'audio',    label: i18n.filterTypeAudio },
			{ value: 'pdf',      label: i18n.filterTypePdf },
			{ value: 'canvas',   label: i18n.filterTypeCanvas },
			{ value: 'other',    label: i18n.filterTypeOther },
		].forEach(({ value, label }) => {
			typeSelect.createEl('option', { text: label, attr: { value } });
		});
		typeSelect.addEventListener('change', () => {
			const v = typeSelect.value as FileTypeGroup | '';
			this.filter = { ...this.filter, typeGroups: v ? [v] : [] };
			this.applyFilter();
			this.renderTable();
		});

		const dateFromLabel = bar.createEl('label', { cls: 'es-rename-date-label' });
		dateFromLabel.createSpan({ text: i18n.filterDateFrom });
		const dateFromInput = dateFromLabel.createEl('input', { type: 'date', cls: 'es-rename-date-input' });
		dateFromInput.addEventListener('change', () => {
			this.filter = { ...this.filter, dateFrom: dateFromInput.value || null };
			this.applyFilter();
			this.renderTable();
		});

		const dateToLabel = bar.createEl('label', { cls: 'es-rename-date-label' });
		dateToLabel.createSpan({ text: i18n.filterDateTo });
		const dateToInput = dateToLabel.createEl('input', { type: 'date', cls: 'es-rename-date-input' });
		dateToInput.addEventListener('change', () => {
			this.filter = { ...this.filter, dateTo: dateToInput.value || null };
			this.applyFilter();
			this.renderTable();
		});

		bar.createEl('button', { text: i18n.clearFilters, cls: 'es-rename-clear-btn' })
			.addEventListener('click', () => {
				this.filter = { search: '', typeGroups: [], dateFrom: null, dateTo: null };
				searchInput.value = '';
				typeSelect.value = '';
				dateFromInput.value = '';
				dateToInput.value = '';
				this.applyFilter();
				this.renderTable();
			});
	}

	// ----------------------------------------------------------------
	// Bulk action bar
	// ----------------------------------------------------------------

	private buildBulkBar(parent: HTMLElement, i18n: typeof this.i18n): void {
		const bar = parent.createDiv({ cls: 'es-rename-bulk-bar' });

		bar.createEl('button', { text: i18n.selectAll, cls: 'es-rename-select-all-btn' })
			.addEventListener('click', () => {
				paginate(this.filteredFiles, this.currentPage, PAGE_SIZE)
					.forEach((f) => this.selectedPaths.add(f.path));
				this.updateBulkCount();
				this.renderTable();
			});

		bar.createEl('button', { text: i18n.deselectAll, cls: 'es-rename-deselect-all-btn' })
			.addEventListener('click', () => {
				this.selectedPaths.clear();
				this.updateBulkCount();
				this.renderTable();
			});

		this.bulkCountEl = bar.createEl('button', {
			text: i18n.bulkRenameBtn(0),
			cls: 'mod-cta es-rename-bulk-btn',
		});
		this.bulkCountEl.addEventListener('click', () => this.openBulkConfirmModal());
	}

	private updateBulkCount(): void {
		if (this.bulkCountEl) {
			this.bulkCountEl.setText(this.i18n.bulkRenameBtn(this.selectedPaths.size));
		}
	}

	private openBulkConfirmModal(): void {
		if (this.selectedPaths.size === 0) return;
		const selected = this.allFiles.filter((f) => this.selectedPaths.has(f.path));
		new BatchRenameConfirmModal(this.plugin.app, selected, (pattern, customText) => {
			void this.doBulkRename(pattern, customText);
		}).open();
	}

	// ----------------------------------------------------------------
	// Table
	// ----------------------------------------------------------------

	private buildTable(parent: HTMLElement, i18n: typeof this.i18n): void {
		const wrapper = parent.createDiv({ cls: 'es-rename-table-wrapper' });
		const table   = wrapper.createEl('table', { cls: 'es-rename-table' });

		const headerRow = table.createEl('thead').createEl('tr');
		['', i18n.columnName, i18n.columnType, i18n.columnModified, i18n.columnActions]
			.forEach((col) => headerRow.createEl('th', { text: col }));

		this.tableBodyEl = table.createEl('tbody');
	}

	private renderTable(): void {
		const { i18n } = this;
		this.tableBodyEl.empty();

		const page = paginate(this.filteredFiles, this.currentPage, PAGE_SIZE);

		if (page.length === 0) {
			const td = this.tableBodyEl.createEl('tr').createEl('td', {
				text: i18n.noFiles,
				cls:  'es-rename-empty-cell',
			});
			td.setAttribute('colspan', '5');
			this.renderPagination();
			return;
		}

		page.forEach((file) => this.renderFileRow(file));
		this.renderPagination();
		this.updateBulkCount();
	}

	private renderFileRow(file: FileRecord): void {
		const { i18n, tableBodyEl } = this;
		const row = tableBodyEl.createEl('tr', { cls: 'es-rename-row' });

		// Checkbox
		const checkbox = row.createEl('td', { cls: 'es-rename-check-td' })
			.createEl('input', { type: 'checkbox' });
		checkbox.checked = this.selectedPaths.has(file.path);
		checkbox.addEventListener('change', () => {
			if (checkbox.checked) this.selectedPaths.add(file.path);
			else this.selectedPaths.delete(file.path);
			this.updateBulkCount();
		});

		// Filename
		const displayName = file.extension ? `${file.basename}.${file.extension}` : file.basename;
		row.createEl('td', { text: displayName, cls: 'es-rename-name-td' });

		// Type
		row.createEl('td', { text: getFileTypeGroup(file.extension), cls: 'es-rename-type-td' });

		// Modified date
		row.createEl('td', { text: formatDate(new Date(file.mtimeMs)), cls: 'es-rename-date-td' });

		// Rename button — opens QuickRenameModal for this file
		row.createEl('td', { cls: 'es-rename-action-td' })
			.createEl('button', { text: i18n.renameBtn, cls: 'mod-cta es-rename-row-btn' })
			.addEventListener('click', () => this.openRowRenameModal(file));
	}

	/** Open QuickRenameModal for a single file row. */
	private openRowRenameModal(file: FileRecord): void {
		const tFile = this.plugin.app.vault.getAbstractFileByPath(file.path);
		if (!(tFile instanceof TFile)) return;

		new QuickRenameModal(this.plugin.app, tFile, () => {
			// Reload file list after rename
			this.loadFiles();
			this.renderTable();
		}).open();
	}

	// ----------------------------------------------------------------
	// Pagination
	// ----------------------------------------------------------------

	private buildPagination(parent: HTMLElement, _i18n: typeof this.i18n): void {
		this.paginationEl = parent.createDiv({ cls: 'es-rename-pagination' });
	}

	private renderPagination(): void {
		const { i18n } = this;
		this.paginationEl.empty();
		const total = getTotalPages(this.filteredFiles.length, PAGE_SIZE);

		const prev = this.paginationEl.createEl('button', { text: i18n.prevPage, cls: 'es-rename-page-btn' });
		prev.disabled = this.currentPage <= 1;
		prev.addEventListener('click', () => {
			if (this.currentPage > 1) { this.currentPage--; this.renderTable(); }
		});

		this.paginationEl.createEl('span', {
			text: i18n.pageInfo(this.currentPage, total),
			cls:  'es-rename-page-info',
		});

		const next = this.paginationEl.createEl('button', { text: i18n.nextPage, cls: 'es-rename-page-btn' });
		next.disabled = this.currentPage >= total;
		next.addEventListener('click', () => {
			if (this.currentPage < total) { this.currentPage++; this.renderTable(); }
		});
	}

	// ----------------------------------------------------------------
	// Bulk rename
	// ----------------------------------------------------------------

	private async doBulkRename(pattern: RenamePattern, customText: string): Promise<void> {
		const { i18n } = this;
		const paths = [...this.selectedPaths];
		let successCount = 0;

		// Track names already committed in this batch run (keyed by directory)
		// to avoid intra-batch collisions for replace-style patterns.
		const usedNamesByDir = new Map<string, Set<string>>();

		// Shared values that are stable across all files
		const date      = formatDate();
		const timestamp = formatTimestamp();

		for (const path of paths) {
			const tFile = this.plugin.app.vault.getAbstractFileByPath(path);
			if (!(tFile instanceof TFile)) continue;

			const dir = tFile.parent ? tFile.parent.path : '';

			// Per-file UUID — each renamed file gets its own unique UUID
			const uuid = crypto.randomUUID();

			const rawName = applyPattern(tFile.basename, tFile.extension, pattern, {
				date, timestamp, uuid, customText,
			});

			// Resolve intra-batch naming collisions (e.g. date-replace or custom-replace
			// would produce the same filename for multiple files)
			if (!usedNamesByDir.has(dir)) usedNamesByDir.set(dir, new Set());
			const usedInDir = usedNamesByDir.get(dir)!;

			// Also seed with the existing vault file at the target name (if any)
			// so we don't collide with files that weren't selected for rename.
			const seedName = rawName;
			if (this.plugin.app.vault.getAbstractFileByPath(dir ? `${dir}/${seedName}` : seedName)) {
				usedInDir.add(seedName);
			}

			const newName = resolveNameConflict(rawName, usedInDir);
			usedInDir.add(newName);

			const newPath = dir ? `${dir}/${newName}` : newName;

			try {
				await this.plugin.app.fileManager.renameFile(tFile, newPath);
				successCount++;
			} catch (err) {
				console.error(`[enhancement-suite] Bulk rename failed for ${path}:`, err);
			}
		}

		new Notice(i18n.renameSuccess(`${successCount} files`));
		this.selectedPaths.clear();
		this.loadFiles();
		this.renderTable();
	}
}
