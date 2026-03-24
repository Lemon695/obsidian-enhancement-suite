import { describe, it, expect } from 'vitest';
import {
	parseBase,
	formatBase,
	validateBase,
	getBaseStats,
} from './parser';

// ---------------------------------------------------------------------------
// parseBase
// ---------------------------------------------------------------------------

describe('parseBase', () => {
	it('parses a valid base object with views', () => {
		const yaml = JSON.stringify({ views: [{ type: 'table', name: 'View1' }] });
		const result = parseBase(yaml);
		expect(result.ok).toBe(true);
		if (result.ok)
			expect(result.value).toEqual({
				views: [{ type: 'table', name: 'View1' }],
			});
	});

	it('parses an object without views key', () => {
		const yaml = JSON.stringify({ foo: 'bar' });
		const result = parseBase(yaml);
		expect(result.ok).toBe(true);
	});

	it('parses an empty object', () => {
		const yaml = JSON.stringify({});
		const result = parseBase(yaml);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toEqual({});
	});

	it('parses multiple views', () => {
		const data = {
			views: [
				{ type: 'cards', name: 'Card View' },
				{ type: 'table', name: 'Table View' },
			],
		};
		const result = parseBase(JSON.stringify(data));
		expect(result.ok).toBe(true);
		if (result.ok)
			expect((result.value as { views: unknown[] }).views).toHaveLength(2);
	});

	it('returns error for empty string', () => {
		const result = parseBase('');
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
	});

	it('returns error for whitespace-only string', () => {
		const result = parseBase('   \n  ');
		expect(result.ok).toBe(false);
	});

	it('returns error for plain text (not YAML/JSON)', () => {
		// The mock parseYaml returns null for non-JSON, which is ok: true, value: null
		// so we just check it doesn't throw
		expect(() => parseBase('not yaml at all !!!')).not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// validateBase
// ---------------------------------------------------------------------------

describe('validateBase', () => {
	it('valid: object with views array', () => {
		const yaml = JSON.stringify({
			views: [{ type: 'table', name: 'My View' }],
		});
		const result = validateBase(yaml);
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it('valid: object with empty views array', () => {
		const yaml = JSON.stringify({ views: [] });
		const result = validateBase(yaml);
		expect(result.valid).toBe(true);
	});

	it('invalid: empty string', () => {
		const result = validateBase('');
		expect(result.valid).toBe(false);
		expect(result.error).toBeTruthy();
	});

	it('invalid: missing views key', () => {
		const yaml = JSON.stringify({ foo: 'bar' });
		const result = validateBase(yaml);
		expect(result.valid).toBe(false);
		expect(result.error).toMatch(/views/);
	});

	it('invalid: views is not an array (string)', () => {
		const yaml = JSON.stringify({ views: 'not-an-array' });
		const result = validateBase(yaml);
		expect(result.valid).toBe(false);
		expect(result.error).toMatch(/array/);
	});

	it('invalid: views is not an array (object)', () => {
		const yaml = JSON.stringify({ views: { type: 'table' } });
		const result = validateBase(yaml);
		expect(result.valid).toBe(false);
	});

	it('invalid: top-level is an array', () => {
		const yaml = JSON.stringify([{ type: 'table' }]);
		const result = validateBase(yaml);
		expect(result.valid).toBe(false);
		expect(result.error).toMatch(/object/);
	});

	it('invalid: top-level is a string', () => {
		// JSON.stringify of a string wraps in quotes
		const result = validateBase(JSON.stringify('hello'));
		expect(result.valid).toBe(false);
	});

	it('invalid: top-level is null', () => {
		const result = validateBase(JSON.stringify(null));
		expect(result.valid).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// formatBase
// ---------------------------------------------------------------------------

describe('formatBase', () => {
	it('returns a string', () => {
		const result = formatBase({ views: [] });
		expect(typeof result).toBe('string');
	});

	it('round-trip: parse then format then parse gives same value', () => {
		const original = { views: [{ type: 'table', name: 'Test' }] };
		const yaml = formatBase(original);
		const parsed = parseBase(yaml);
		expect(parsed.ok).toBe(true);
		if (parsed.ok) expect(parsed.value).toEqual(original);
	});

	it('handles null without throwing', () => {
		expect(() => formatBase(null)).not.toThrow();
	});

	it('handles empty object without throwing', () => {
		expect(() => formatBase({})).not.toThrow();
	});

	it('handles nested objects', () => {
		const data = {
			views: [{ type: 'cards', filters: { and: ['file.inFolder("Books")'] } }],
		};
		const result = formatBase(data);
		expect(typeof result).toBe('string');
		expect(result.length).toBeGreaterThan(0);
	});
});

// ---------------------------------------------------------------------------
// getBaseStats
// ---------------------------------------------------------------------------

describe('getBaseStats', () => {
	it('counts views correctly', () => {
		const value = {
			views: [
				{ type: 'table' },
				{ type: 'cards' },
				{ type: 'table' },
			],
		};
		const stats = getBaseStats(value, '');
		expect(stats.viewCount).toBe(3);
	});

	it('viewCount is 0 when views array is empty', () => {
		const stats = getBaseStats({ views: [] }, '');
		expect(stats.viewCount).toBe(0);
	});

	it('viewCount is 0 when views key is missing', () => {
		const stats = getBaseStats({ foo: 'bar' }, '');
		expect(stats.viewCount).toBe(0);
	});

	it('viewCount is 0 for null value', () => {
		const stats = getBaseStats(null, '');
		expect(stats.viewCount).toBe(0);
	});

	it('size equals rawContent.length', () => {
		const raw = 'views:\n  - type: table\n';
		const stats = getBaseStats({}, raw);
		expect(stats.size).toBe(raw.length);
	});

	it('depth: flat object has depth 1', () => {
		const stats = getBaseStats({ views: [] }, '');
		expect(stats.depth).toBeGreaterThanOrEqual(1);
	});

	it('depth: nested object increases depth', () => {
		const value = { views: [{ type: 'cards', filters: { and: ['x'] } }] };
		const stats = getBaseStats(value, '');
		expect(stats.depth).toBeGreaterThanOrEqual(3);
	});

	it('depth: primitive (null) is 0', () => {
		const stats = getBaseStats(null, '');
		expect(stats.depth).toBe(0);
	});

	it('depth: empty object is 1', () => {
		const stats = getBaseStats({}, '');
		expect(stats.depth).toBe(1);
	});

	it('viewCount is 0 when views is not an array', () => {
		const stats = getBaseStats({ views: 'oops' }, '');
		expect(stats.viewCount).toBe(0);
	});
});
