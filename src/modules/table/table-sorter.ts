/**
 * Table Sorter — Pure functions for Markdown table parsing, sorting, and formatting.
 *
 * All functions are side-effect-free and do not depend on the Obsidian API,
 * making them fully unit-testable.
 */

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export interface ParsedTable {
	/** Header cell values (trimmed). */
	headers: string[];
	/** Data rows, each an array of trimmed cell values. */
	rows: string[][];
	/** Snapshot of the original row order before any sort (separate array copy). */
	originalRows: string[][];
}

// ----------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------

/** Returns true if a line looks like a Markdown table row (starts with |). */
function isTableRow(line: string): boolean {
	return line.trim().startsWith('|');
}

/**
 * Returns true if a line is a Markdown table separator row.
 * A separator row's cells contain only dashes, colons, and whitespace.
 * Example: `| --- | :---: | ---: |`
 */
function isSeparatorRow(line: string): boolean {
	if (!line.includes('|')) return false;
	const cells = line.split('|').slice(1, -1);
	return cells.length > 0 && cells.every((cell) => /^[\s\-:]+$/.test(cell));
}

/** Splits a table row string into trimmed cell values. */
function parseRow(line: string): string[] {
	return line
		.split('|')
		.slice(1, -1)
		.map((cell) => cell.trim());
}

/** Returns true if the string represents a finite number. */
function isNumericValue(s: string): boolean {
	if (s === '') return false;
	const n = Number(s);
	return !isNaN(n) && isFinite(n);
}

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------

/**
 * Parses a Markdown table string into a `ParsedTable`.
 *
 * Returns `null` when:
 * - The text is empty.
 * - No separator row (dashes row) is found at the second line.
 */
export function parseMarkdownTable(text: string): ParsedTable | null {
	if (!text) return null;

	const lines = text.split('\n');
	if (lines.length < 2) return null;

	// The separator must be on line index 1 (standard Markdown table layout).
	if (!isSeparatorRow(lines[1] ?? '')) return null;

	const headers = parseRow(lines[0] ?? '');
	const rows = lines.slice(2).map(parseRow);

	return {
		headers,
		rows,
		originalRows: rows.map((r) => [...r]),
	};
}

/**
 * Returns a new `ParsedTable` with rows sorted by the given column index and direction.
 *
 * - Numeric columns are sorted numerically (not lexicographically).
 * - String columns use `localeCompare`.
 * - The input table is never mutated.
 */
export function sortTableRows(
	table: ParsedTable,
	colIndex: number,
	direction: 'asc' | 'desc'
): ParsedTable {
	const colValues = table.rows.map((row) => row[colIndex] ?? '');
	const allNumeric = colValues.every(isNumericValue);

	const sorted = [...table.rows].sort((a, b) => {
		const aVal = a[colIndex] ?? '';
		const bVal = b[colIndex] ?? '';

		const cmp = allNumeric
			? parseFloat(aVal) - parseFloat(bVal)
			: aVal.localeCompare(bVal);

		return direction === 'asc' ? cmp : -cmp;
	});

	return {
		headers: table.headers,
		rows: sorted,
		originalRows: table.originalRows,
	};
}

/**
 * Formats a `ParsedTable` back into a Markdown table string.
 *
 * All columns are padded to a consistent width so every row has
 * the same total character length.
 */
export function formatMarkdownTable(table: ParsedTable): string {
	const colCount = table.headers.length;

	// Compute max width for each column (header + all data cells, min 3 for separator).
	const colWidths: number[] = table.headers.map((header, i) => {
		const maxData = table.rows.reduce(
			(max, row) => Math.max(max, (row[i] ?? '').length),
			0
		);
		return Math.max(header.length, maxData, 3);
	});

	const formatRow = (cells: string[]): string => {
		const padded = cells.map((cell, i) => cell.padEnd(colWidths[i] ?? 0));
		return `| ${padded.join(' | ')} |`;
	};

	const headerLine = formatRow(table.headers);
	const separatorLine = `| ${colWidths.map((w) => '-'.repeat(w)).join(' | ')} |`;
	const dataLines = table.rows.map((row) => {
		const cells = Array.from({ length: colCount }, (_, i) => row[i] ?? '');
		return formatRow(cells);
	});

	return [headerLine, separatorLine, ...dataLines].join('\n');
}

/**
 * Returns the zero-based column index of the table cell containing the cursor.
 *
 * Returns `-1` if the line does not look like a table row or the cursor is
 * outside any cell.
 *
 * @param line      The full text of the current editor line.
 * @param cursorCh  Zero-based character offset within `line`.
 */
export function getColumnIndexAtCursor(line: string, cursorCh: number): number {
	if (!line || !isTableRow(line)) return -1;

	// Count how many `|` characters appear strictly before the cursor position.
	const beforeCursor = line.substring(0, cursorCh);
	const pipesBefore = (beforeCursor.match(/\|/g) ?? []).length;

	// The cursor must be after at least one pipe to be inside a column.
	if (pipesBefore === 0) return -1;
	return pipesBefore - 1;
}

/**
 * Finds the start and end line indices (inclusive) of the Markdown table that
 * contains the given line.
 *
 * Returns `null` if `lineIndex` does not point to a table row.
 *
 * @param lines      All lines of the document as an array.
 * @param lineIndex  Zero-based line index of the cursor.
 */
export function findTableBounds(
	lines: string[],
	lineIndex: number
): { start: number; end: number } | null {
	if (lineIndex < 0 || lineIndex >= lines.length) return null;
	if (!isTableRow(lines[lineIndex] ?? '')) return null;

	let start = lineIndex;
	while (start > 0 && isTableRow(lines[start - 1] ?? '')) {
		start--;
	}

	let end = lineIndex;
	while (end < lines.length - 1 && isTableRow(lines[end + 1] ?? '')) {
		end++;
	}

	return { start, end };
}
