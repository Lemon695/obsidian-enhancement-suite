import { describe, it, expect } from 'vitest';
import {
	parseJson,
	formatJson,
	validateJson,
	getJsonStats,
} from './parser';

// ---------------------------------------------------------------------------
// parseJson
// ---------------------------------------------------------------------------

describe('parseJson', () => {
	it('parses a valid object', () => {
		const result = parseJson('{"a":1,"b":"hello"}');
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toEqual({ a: 1, b: 'hello' });
	});

	it('parses a valid array', () => {
		const result = parseJson('[1, 2, 3]');
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toEqual([1, 2, 3]);
	});

	it('parses null', () => {
		const result = parseJson('null');
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toBeNull();
	});

	it('parses a boolean', () => {
		const result = parseJson('true');
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toBe(true);
	});

	it('parses a number', () => {
		const result = parseJson('42');
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toBe(42);
	});

	it('parses an empty object', () => {
		const result = parseJson('{}');
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toEqual({});
	});

	it('parses an empty array', () => {
		const result = parseJson('[]');
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toEqual([]);
	});

	it('returns error for invalid JSON (unquoted key)', () => {
		const result = parseJson('{a: 1}');
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
	});

	it('returns error for trailing comma', () => {
		const result = parseJson('{"a":1,}');
		expect(result.ok).toBe(false);
	});

	it('returns error for empty string', () => {
		const result = parseJson('');
		expect(result.ok).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// formatJson
// ---------------------------------------------------------------------------

describe('formatJson', () => {
	it('formats a flat object with 2-space indent by default', () => {
		expect(formatJson({ a: 1 })).toBe('{\n  "a": 1\n}');
	});

	it('formats with custom indent', () => {
		expect(formatJson({ a: 1 }, 4)).toBe('{\n    "a": 1\n}');
	});

	it('formats an array', () => {
		expect(formatJson([1, 2])).toBe('[\n  1,\n  2\n]');
	});

	it('formats null', () => {
		expect(formatJson(null)).toBe('null');
	});

	it('formats nested object', () => {
		const result = formatJson({ a: { b: 2 } });
		expect(result).toContain('"a"');
		expect(result).toContain('"b"');
	});
});

// ---------------------------------------------------------------------------
// validateJson
// ---------------------------------------------------------------------------

describe('validateJson', () => {
	it('returns valid for a correct JSON object', () => {
		expect(validateJson('{"a":1}').valid).toBe(true);
	});

	it('returns valid for an empty array', () => {
		expect(validateJson('[]').valid).toBe(true);
	});

	it('returns valid for a primitive', () => {
		expect(validateJson('123').valid).toBe(true);
	});

	it('returns invalid for malformed JSON', () => {
		const result = validateJson('{invalid}');
		expect(result.valid).toBe(false);
		expect(result.error).toBeTruthy();
	});

	it('returns invalid for JSON with trailing comma', () => {
		expect(validateJson('{"a":1,}').valid).toBe(false);
	});

	it('invalid result contains error string', () => {
		const result = validateJson('{"a": }');
		expect(result.valid).toBe(false);
		expect(typeof result.error).toBe('string');
	});
});

// ---------------------------------------------------------------------------
// getJsonStats
// ---------------------------------------------------------------------------

describe('getJsonStats', () => {
	it('flat object: correct key count and depth', () => {
		const stats = getJsonStats({ a: 1, b: 2 });
		expect(stats.keys).toBe(2);
		expect(stats.depth).toBe(1);
	});

	it('nested object: depth counts nesting', () => {
		const stats = getJsonStats({ a: { b: { c: 1 } } });
		expect(stats.depth).toBe(3);
		expect(stats.keys).toBe(3);
	});

	it('array of primitives: depth 1, keys 0', () => {
		const stats = getJsonStats([1, 2, 3]);
		expect(stats.depth).toBe(1);
		expect(stats.keys).toBe(0);
	});

	it('array of objects: keys from nested objects counted', () => {
		const stats = getJsonStats([{ a: 1 }, { b: 2 }]);
		expect(stats.keys).toBe(2);
		expect(stats.depth).toBe(2);
	});

	it('empty object: keys 0, depth 1', () => {
		const stats = getJsonStats({});
		expect(stats.keys).toBe(0);
		expect(stats.depth).toBe(1);
	});

	it('empty array: keys 0, depth 1', () => {
		const stats = getJsonStats([]);
		expect(stats.keys).toBe(0);
		expect(stats.depth).toBe(1);
	});

	it('primitive null: keys 0, depth 0', () => {
		const stats = getJsonStats(null);
		expect(stats.keys).toBe(0);
		expect(stats.depth).toBe(0);
	});

	it('size matches JSON.stringify length', () => {
		const value = { hello: 'world' };
		const stats = getJsonStats(value);
		expect(stats.size).toBe(JSON.stringify(value).length);
	});

	it('deeply nested: depth is max path length', () => {
		const value = { a: [{ b: { c: 'd' } }] };
		// a: depth 1, []: depth 2, {}: depth 3, b: depth 3, c->d: depth 4
		const stats = getJsonStats(value);
		expect(stats.depth).toBe(4);
	});
});
