import { type Editor } from 'obsidian';
import type { PluginModule } from '../../core/types';
import type EnhancementSuitePlugin from '../../main';
import { renderTableSettings } from './settings';
import { t } from '../../i18n/locale';
import { tableModuleI18n } from '../../i18n/modules/table/module';
import { tableCommandsI18n } from '../../i18n/modules/table/commands';
import {
	parseMarkdownTable,
	sortTableRows,
	formatMarkdownTable,
	getColumnIndexAtCursor,
	findTableBounds,
} from './table-sorter';

/**
 * Table Enhancement Module
 *
 * Adds interactive features to Markdown tables:
 *   - Reading View: click a column header to cycle through asc → desc → original sort.
 *     Sort indicators ▲ / ▼ are shown on the active column header.
 *   - Editor commands: sort the table at the cursor position ascending or descending.
 */
export class TableModule implements PluginModule {
	readonly id = 'table';
	readonly name = t(tableModuleI18n).name;
	readonly description = t(tableModuleI18n).description;

	constructor(private readonly plugin: EnhancementSuitePlugin) {}

	onload(): void {
		this.registerCommands();
		this.registerPostProcessor();
	}

	onunload(): void {
		// Commands and MarkdownPostProcessor are cleaned up automatically by Obsidian.
	}

	renderSettings(containerEl: HTMLElement): void {
		renderTableSettings(this.plugin, containerEl);
	}

	// ---------------------------------------------------------------------------
	// Reading View — MarkdownPostProcessor
	// ---------------------------------------------------------------------------

	private registerPostProcessor(): void {
		this.plugin.registerMarkdownPostProcessor((el) => {
			el.querySelectorAll<HTMLTableElement>('table').forEach((table) => {
				this.enhanceTable(table);
			});
		});
	}

	/**
	 * Injects clickable sort indicators into every `<th>` of a rendered table.
	 * Clicking cycles the sort state: none → asc (▲) → desc (▼) → none.
	 */
	private enhanceTable(table: HTMLTableElement): void {
		const thead = table.tHead;
		if (!thead) return;
		const headerRow = thead.rows[0];
		if (!headerRow) return;
		const tbody = table.tBodies[0];
		if (!tbody) return;

		// Capture the original DOM row order so we can restore it on the third click.
		const originalRows = Array.from(tbody.rows);

		let activeCol = -1;
		let activeDir: 'asc' | 'desc' | null = null;

		const ths = Array.from(headerRow.cells);

		/** Update sort indicator text on all header cells. */
		const updateIndicators = (): void => {
			ths.forEach((th, i) => {
				const icon = th.querySelector<HTMLElement>('.es-table-sort-icon');
				if (!icon) return;
				if (i === activeCol && activeDir !== null) {
					icon.textContent = activeDir === 'asc' ? ' ▲' : ' ▼';
				} else {
					icon.textContent = '';
				}
			});
		};

		/** Re-order `<tr>` nodes inside `<tbody>` to reflect the current sort state. */
		const applySort = (): void => {
			const sorted =
				activeCol === -1 || activeDir === null
					? originalRows
					: sortDomRows(Array.from(tbody.rows), activeCol, activeDir);
			sorted.forEach((row) => tbody.appendChild(row));
			updateIndicators();
		};

		ths.forEach((th, colIdx) => {
			th.classList.add('es-table-sortable');
			const icon = th.createSpan({ cls: 'es-table-sort-icon' });
			icon.textContent = '';

			th.addEventListener('click', () => {
				if (activeCol !== colIdx) {
					activeCol = colIdx;
					activeDir = 'asc';
				} else if (activeDir === 'asc') {
					activeDir = 'desc';
				} else {
					activeCol = -1;
					activeDir = null;
				}
				applySort();
			});
		});
	}

	// ---------------------------------------------------------------------------
	// Editor commands
	// ---------------------------------------------------------------------------

	private registerCommands(): void {
		const i18n = t(tableCommandsI18n);

		this.plugin.addCommand({
			id: 'table-sort-column-asc',
			name: i18n.sortAsc.name,
			editorCallback: (editor: Editor) => {
				this.sortTableAtCursor(editor, 'asc');
			},
		});

		this.plugin.addCommand({
			id: 'table-sort-column-desc',
			name: i18n.sortDesc.name,
			editorCallback: (editor: Editor) => {
				this.sortTableAtCursor(editor, 'desc');
			},
		});
	}

	/**
	 * Resolves the table and column at the current cursor position, then
	 * sorts the table's Markdown source in the editor.
	 */
	private sortTableAtCursor(editor: Editor, direction: 'asc' | 'desc'): void {
		const cursor = editor.getCursor();
		const currentLine = editor.getLine(cursor.line);
		const colIdx = getColumnIndexAtCursor(currentLine, cursor.ch);
		if (colIdx === -1) return;

		const lineCount = editor.lineCount();
		const allLines = Array.from({ length: lineCount }, (_, i) => editor.getLine(i));

		const bounds = findTableBounds(allLines, cursor.line);
		if (!bounds) return;

		const tableText = allLines.slice(bounds.start, bounds.end + 1).join('\n');
		const parsed = parseMarkdownTable(tableText);
		if (!parsed) return;

		const sorted = sortTableRows(parsed, colIdx, direction);
		const formatted = formatMarkdownTable(sorted);

		editor.replaceRange(
			formatted,
			{ line: bounds.start, ch: 0 },
			{ line: bounds.end, ch: editor.getLine(bounds.end).length }
		);
	}
}

// ---------------------------------------------------------------------------
// Module-level helper (pure — no `this` needed)
// ---------------------------------------------------------------------------

/**
 * Sorts an array of `<tr>` elements by the text content of the cell at `colIdx`.
 * Numeric columns are sorted numerically; others use `localeCompare`.
 * Returns a new array without mutating the input.
 */
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
