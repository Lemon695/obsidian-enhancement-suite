import { BasesView, type BasesPropertyId, type QueryController } from 'obsidian';
import { formatMarkdownTable, type ParsedTable } from '../table/table-sorter';
import { t } from '../../i18n/locale';
import { basesViewI18n } from '../../i18n/modules/bases/view';

/** Unique view type ID registered with `plugin.registerBasesView`. */
export const MARKDOWN_TABLE_VIEW_ID = 'es-markdown-table';

/**
 * A custom Bases view that renders query results as an interactive HTML table.
 *
 * Features:
 *   - Clickable column headers cycle through asc (▲) → desc (▼) → original order
 *   - "Copy as Markdown" button exports the current data as a formatted Markdown table
 *   - Uses the same `formatMarkdownTable` pure function as the Table module
 *
 * Registration: `plugin.registerBasesView(MARKDOWN_TABLE_VIEW_ID, { ... })`
 * Obsidian requirement: ≥ 1.10 with Bases core plugin enabled
 */
export class MarkdownTableBasesView extends BasesView {
	readonly type = MARKDOWN_TABLE_VIEW_ID;

	private tableContainer!: HTMLElement;
	private copyBtn!: HTMLButtonElement;
	private sortState: { colIdx: number; dir: 'asc' | 'desc' } | null = null;
	private originalRows: HTMLTableRowElement[] = [];
	private readonly i18n = t(basesViewI18n);

	constructor(controller: QueryController, private readonly el: HTMLElement) {
		super(controller);
	}

	// ---------------------------------------------------------------------------
	// Component lifecycle
	// ---------------------------------------------------------------------------

	onload(): void {
		// Toolbar (rendered once; content updated in onDataUpdated)
		const toolbar = this.el.createDiv({ cls: 'es-bases-mt-toolbar' });
		this.copyBtn = toolbar.createEl('button', {
			text: this.i18n.copyBtn,
			cls: 'es-bases-mt-copy-btn',
		});
		this.copyBtn.addEventListener('click', () => this.copyAsMarkdown());

		// Table wrapper
		this.tableContainer = this.el.createDiv({ cls: 'es-bases-mt-container' });
	}

	onunload(): void {
		this.el.empty();
	}

	// ---------------------------------------------------------------------------
	// BasesView contract
	// ---------------------------------------------------------------------------

	onDataUpdated(): void {
		this.sortState = null;
		this.renderTable();
	}

	// ---------------------------------------------------------------------------
	// Rendering
	// ---------------------------------------------------------------------------

	private getColumns(): BasesPropertyId[] {
		const ordered = this.config.getOrder();
		return ordered.length > 0 ? ordered : this.data.properties;
	}

	private renderTable(): void {
		this.tableContainer.empty();
		this.originalRows = [];

		const cols = this.getColumns();
		if (cols.length === 0 || this.data.data.length === 0) return;

		const table = this.tableContainer.createEl('table', { cls: 'es-bases-mt-table' });

		// --- <thead> ---
		const thead = table.createEl('thead');
		const headerRow = thead.createEl('tr');
		const ths: HTMLTableCellElement[] = [];

		cols.forEach((propId, colIdx) => {
			const th = headerRow.createEl('th', { cls: 'es-table-sortable' });
			th.createSpan({ text: this.config.getDisplayName(propId) });
			const icon = th.createSpan({ cls: 'es-table-sort-icon' });
			icon.textContent = '';
			th.addEventListener('click', () => this.handleHeaderClick(colIdx, ths));
			ths.push(th);
		});

		// --- <tbody> ---
		const tbody = table.createEl('tbody');
		for (const entry of this.data.data) {
			const tr = tbody.createEl('tr');
			for (const propId of cols) {
				const td = tr.createEl('td');
				const value = entry.getValue(propId);
				if (value !== null) {
					value.renderTo(td, this.app.renderContext);
				}
			}
		}

		this.originalRows = Array.from(tbody.rows);
	}

	// ---------------------------------------------------------------------------
	// Sort interaction
	// ---------------------------------------------------------------------------

	private handleHeaderClick(colIdx: number, ths: HTMLTableCellElement[]): void {
		// Cycle: none → asc → desc → none
		if (this.sortState?.colIdx !== colIdx) {
			this.sortState = { colIdx, dir: 'asc' };
		} else if (this.sortState.dir === 'asc') {
			this.sortState = { colIdx, dir: 'desc' };
		} else {
			this.sortState = null;
		}

		const tbody = this.tableContainer.querySelector('tbody');
		if (!tbody) return;

		const sorted =
			this.sortState === null
				? this.originalRows
				: sortDomRows(Array.from(tbody.rows), this.sortState.colIdx, this.sortState.dir);

		sorted.forEach((row) => tbody.appendChild(row));

		// Update indicators on all headers
		ths.forEach((th, i) => {
			const icon = th.querySelector<HTMLElement>('.es-table-sort-icon');
			if (!icon) return;
			if (this.sortState !== null && i === this.sortState.colIdx) {
				icon.textContent = this.sortState.dir === 'asc' ? ' ▲' : ' ▼';
			} else {
				icon.textContent = '';
			}
		});
	}

	// ---------------------------------------------------------------------------
	// Copy as Markdown
	// ---------------------------------------------------------------------------

	private copyAsMarkdown(): void {
		const cols = this.getColumns();
		const headers = cols.map((propId) => this.config.getDisplayName(propId));
		const rows = this.data.data.map((entry) =>
			cols.map((propId) => entry.getValue(propId)?.toString() ?? '')
		);

		const parsed: ParsedTable = { headers, rows, originalRows: rows };
		const md = formatMarkdownTable(parsed);

		navigator.clipboard.writeText(md).then(() => {
			const original = this.copyBtn.textContent ?? '';
			this.copyBtn.textContent = this.i18n.copied;
			window.setTimeout(() => {
				this.copyBtn.textContent = original;
			}, 1500);
		}).catch(() => {
			// Silent fail: clipboard API may be unavailable in some environments.
		});
	}
}

// ---------------------------------------------------------------------------
// DOM sort helper (duplicated from table/index.ts to keep modules independent)
// ---------------------------------------------------------------------------

function sortDomRows(
	rows: HTMLTableRowElement[],
	colIdx: number,
	dir: 'asc' | 'desc'
): HTMLTableRowElement[] {
	const vals = rows.map((row) => row.cells[colIdx]?.textContent?.trim() ?? '');
	const allNumeric = vals.every(
		(v) => v !== '' && !isNaN(Number(v)) && isFinite(Number(v))
	);

	return [...rows].sort((a, b) => {
		const aVal = a.cells[colIdx]?.textContent?.trim() ?? '';
		const bVal = b.cells[colIdx]?.textContent?.trim() ?? '';
		const cmp = allNumeric
			? parseFloat(aVal) - parseFloat(bVal)
			: aVal.localeCompare(bVal);
		return dir === 'asc' ? cmp : -cmp;
	});
}
