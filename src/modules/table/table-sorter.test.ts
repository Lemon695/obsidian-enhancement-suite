import { describe, it, expect } from 'vitest';
import {
	parseMarkdownTable,
	sortTableRows,
	formatMarkdownTable,
	getColumnIndexAtCursor,
	findTableBounds,
} from './table-sorter';

// ----------------------------------------------------------------
// 测试数据
// ----------------------------------------------------------------
const SIMPLE_TABLE = [
	'| Name    | Age | Score |',
	'| ------- | --- | ----- |',
	'| Charlie | 30  | 85    |',
	'| Alice   | 25  | 92    |',
	'| Bob     | 35  | 78    |',
].join('\n');

const NUMERIC_TABLE = [
	'| Item  | Value |',
	'| ----- | ----- |',
	'| B     | 10    |',
	'| A     | 200   |',
	'| C     | 3     |',
].join('\n');

const SINGLE_ROW_TABLE = [
	'| Name  | Age |',
	'| ----- | --- |',
	'| Alice | 25  |',
].join('\n');

// ----------------------------------------------------------------
// parseMarkdownTable
// ----------------------------------------------------------------
describe('parseMarkdownTable', () => {
	it('parses headers from the first row', () => {
		const result = parseMarkdownTable(SIMPLE_TABLE);
		expect(result).not.toBeNull();
		expect(result!.headers).toEqual(['Name', 'Age', 'Score']);
	});

	it('parses data rows', () => {
		const result = parseMarkdownTable(SIMPLE_TABLE);
		expect(result!.rows).toHaveLength(3);
		expect(result!.rows[0]).toEqual(['Charlie', '30', '85']);
	});

	it('returns null for empty string', () => {
		expect(parseMarkdownTable('')).toBeNull();
	});

	it('returns null for text without separator row', () => {
		expect(parseMarkdownTable('| a | b |\n| 1 | 2 |')).toBeNull();
	});

	it('preserves original row order in originalRows', () => {
		const result = parseMarkdownTable(SIMPLE_TABLE);
		expect(result!.originalRows).toEqual(result!.rows);
		// originalRows should be a separate copy
		expect(result!.originalRows).not.toBe(result!.rows);
	});

	it('parses table with single data row', () => {
		const result = parseMarkdownTable(SINGLE_ROW_TABLE);
		expect(result!.rows).toHaveLength(1);
		expect(result!.rows[0]).toEqual(['Alice', '25']);
	});

	it('strips extra whitespace from cell values', () => {
		const result = parseMarkdownTable(SIMPLE_TABLE);
		expect(result!.rows[0]![0]).toBe('Charlie');
		expect(result!.headers[0]).toBe('Name');
	});
});

// ----------------------------------------------------------------
// sortTableRows
// ----------------------------------------------------------------
describe('sortTableRows', () => {
	it('sorts column 0 ascending (string)', () => {
		const table = parseMarkdownTable(SIMPLE_TABLE)!;
		const sorted = sortTableRows(table, 0, 'asc');
		expect(sorted.rows.map((r) => r[0])).toEqual(['Alice', 'Bob', 'Charlie']);
	});

	it('sorts column 0 descending (string)', () => {
		const table = parseMarkdownTable(SIMPLE_TABLE)!;
		const sorted = sortTableRows(table, 0, 'desc');
		expect(sorted.rows.map((r) => r[0])).toEqual(['Charlie', 'Bob', 'Alice']);
	});

	it('sorts numeric column correctly (not lexicographic)', () => {
		const table = parseMarkdownTable(NUMERIC_TABLE)!;
		const sorted = sortTableRows(table, 1, 'asc');
		expect(sorted.rows.map((r) => r[1])).toEqual(['3', '10', '200']);
	});

	it('sorts numeric column descending', () => {
		const table = parseMarkdownTable(NUMERIC_TABLE)!;
		const sorted = sortTableRows(table, 1, 'desc');
		expect(sorted.rows.map((r) => r[1])).toEqual(['200', '10', '3']);
	});

	it('does not mutate the input table', () => {
		const table = parseMarkdownTable(SIMPLE_TABLE)!;
		const originalFirst = table.rows[0]![0];
		sortTableRows(table, 0, 'asc');
		expect(table.rows[0]![0]).toBe(originalFirst);
	});

	it('sorts by age column (numeric)', () => {
		const table = parseMarkdownTable(SIMPLE_TABLE)!;
		const sorted = sortTableRows(table, 1, 'asc');
		expect(sorted.rows.map((r) => r[1])).toEqual(['25', '30', '35']);
	});
});

// ----------------------------------------------------------------
// formatMarkdownTable
// ----------------------------------------------------------------
describe('formatMarkdownTable', () => {
	it('round-trips a parsed table back to valid Markdown', () => {
		const table = parseMarkdownTable(SIMPLE_TABLE)!;
		const output = formatMarkdownTable(table);
		// Re-parse should yield the same data
		const reparsed = parseMarkdownTable(output)!;
		expect(reparsed.headers).toEqual(table.headers);
		expect(reparsed.rows).toEqual(table.rows);
	});

	it('produces a separator row on line 2', () => {
		const table = parseMarkdownTable(SIMPLE_TABLE)!;
		const lines = formatMarkdownTable(table).split('\n');
		expect(lines[1]).toMatch(/^\|[\s-|]+\|$/);
	});

	it('aligns columns to consistent widths', () => {
		const table = parseMarkdownTable(SIMPLE_TABLE)!;
		const lines = formatMarkdownTable(table).split('\n');
		const widths = lines.map((l) => l.length);
		// All rows should have the same length
		expect(new Set(widths).size).toBe(1);
	});
});

// ----------------------------------------------------------------
// getColumnIndexAtCursor
// ----------------------------------------------------------------
describe('getColumnIndexAtCursor', () => {
	it('returns 0 for cursor in first column', () => {
		//              0123456789
		const line = '| Alice | 25 |';
		expect(getColumnIndexAtCursor(line, 2)).toBe(0);
	});

	it('returns 1 for cursor in second column', () => {
		const line = '| Alice | 25 |';
		expect(getColumnIndexAtCursor(line, 10)).toBe(1);
	});

	it('returns -1 for cursor outside a table row', () => {
		expect(getColumnIndexAtCursor('just some text', 5)).toBe(-1);
	});

	it('returns -1 for empty string', () => {
		expect(getColumnIndexAtCursor('', 0)).toBe(-1);
	});
});

// ----------------------------------------------------------------
// findTableBounds
// ----------------------------------------------------------------
describe('findTableBounds', () => {
	const docLines = [
		'# Heading',
		'',
		'| A | B |',
		'| - | - |',
		'| 1 | 2 |',
		'| 3 | 4 |',
		'',
		'Some text',
	];

	it('finds table start and end when cursor is on header row', () => {
		const bounds = findTableBounds(docLines, 2);
		expect(bounds).toEqual({ start: 2, end: 5 });
	});

	it('finds table start and end when cursor is on data row', () => {
		const bounds = findTableBounds(docLines, 4);
		expect(bounds).toEqual({ start: 2, end: 5 });
	});

	it('returns null when cursor is not on a table row', () => {
		expect(findTableBounds(docLines, 0)).toBeNull();
		expect(findTableBounds(docLines, 1)).toBeNull();
		expect(findTableBounds(docLines, 7)).toBeNull();
	});
});
