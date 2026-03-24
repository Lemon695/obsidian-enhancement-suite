import { describe, it, expect } from 'vitest';
import { searchInContent, applyReplacement } from './searcher';

// ---------------------------------------------------------------------------
// searchInContent
// ---------------------------------------------------------------------------

describe('searchInContent — 基础搜索', () => {
	it('空 term 返回空数组', () => {
		expect(searchInContent('hello world', '', { caseSensitive: false, useRegex: false })).toEqual([]);
	});

	it('无匹配时返回空数组', () => {
		expect(searchInContent('hello', 'xyz', { caseSensitive: false, useRegex: false })).toHaveLength(0);
	});

	it('找到单个匹配', () => {
		const matches = searchInContent('hello world', 'world', {
			caseSensitive: false,
			useRegex: false,
		});
		expect(matches).toHaveLength(1);
		expect(matches[0]?.matchText).toBe('world');
		expect(matches[0]?.line).toBe(0);
		expect(matches[0]?.ch).toBe(6);
	});

	it('找到多行匹配', () => {
		const content = 'foo bar\nbaz foo\nqux';
		const matches = searchInContent(content, 'foo', {
			caseSensitive: false,
			useRegex: false,
		});
		expect(matches).toHaveLength(2);
		expect(matches[0]?.line).toBe(0);
		expect(matches[1]?.line).toBe(1);
	});

	it('同一行有多个匹配', () => {
		const matches = searchInContent('abcabc', 'abc', {
			caseSensitive: false,
			useRegex: false,
		});
		expect(matches).toHaveLength(2);
		expect(matches[0]?.ch).toBe(0);
		expect(matches[1]?.ch).toBe(3);
	});
});

describe('searchInContent — 大小写敏感', () => {
	it('大小写不敏感（默认）：匹配大小写变体', () => {
		const matches = searchInContent('Hello HELLO hello', 'hello', {
			caseSensitive: false,
			useRegex: false,
		});
		expect(matches).toHaveLength(3);
	});

	it('大小写敏感：只匹配精确大小写', () => {
		const matches = searchInContent('Hello HELLO hello', 'hello', {
			caseSensitive: true,
			useRegex: false,
		});
		expect(matches).toHaveLength(1);
		expect(matches[0]?.matchText).toBe('hello');
	});
});

describe('searchInContent — 正则表达式', () => {
	it('正则模式匹配数字', () => {
		const matches = searchInContent('abc 123 def 456', '\\d+', {
			caseSensitive: false,
			useRegex: true,
		});
		expect(matches).toHaveLength(2);
		expect(matches[0]?.matchText).toBe('123');
		expect(matches[1]?.matchText).toBe('456');
	});

	it('无效正则返回空数组（不抛异常）', () => {
		const result = searchInContent('hello', '[invalid', {
			caseSensitive: false,
			useRegex: true,
		});
		expect(result).toEqual([]);
	});

	it('零宽匹配（如 /a*/）不会死循环', () => {
		const matches = searchInContent('abc', 'a*', {
			caseSensitive: false,
			useRegex: true,
		});
		// 结果数量不重要，关键是不死循环
		expect(Array.isArray(matches)).toBe(true);
	});
});

describe('searchInContent — 偏移量校验', () => {
	it('from/to 偏移量对应原始字符串中的正确位置', () => {
		const content = 'hello world';
		const matches = searchInContent(content, 'world', {
			caseSensitive: false,
			useRegex: false,
		});
		const m = matches[0];
		expect(m).toBeDefined();
		if (m) {
			expect(content.slice(m.from, m.to)).toBe('world');
		}
	});

	it('多行文本：第二行的 from/to 偏移量正确', () => {
		const content = 'first\nsecond line';
		const matches = searchInContent(content, 'second', {
			caseSensitive: false,
			useRegex: false,
		});
		const m = matches[0];
		expect(m).toBeDefined();
		if (m) {
			expect(content.slice(m.from, m.to)).toBe('second');
			expect(m.line).toBe(1);
		}
	});
});

// ---------------------------------------------------------------------------
// applyReplacement
// ---------------------------------------------------------------------------

describe('applyReplacement', () => {
	it('替换单个匹配', () => {
		const content = 'hello world';
		const matches = searchInContent(content, 'world', {
			caseSensitive: false,
			useRegex: false,
		});
		expect(applyReplacement(content, matches, 'earth')).toBe('hello earth');
	});

	it('替换多个匹配', () => {
		const content = 'foo bar foo';
		const matches = searchInContent(content, 'foo', {
			caseSensitive: false,
			useRegex: false,
		});
		expect(applyReplacement(content, matches, 'baz')).toBe('baz bar baz');
	});

	it('无匹配时返回原字符串', () => {
		const content = 'hello world';
		expect(applyReplacement(content, [], 'anything')).toBe('hello world');
	});

	it('替换为空字符串（删除匹配内容）', () => {
		const content = 'abc 123 def';
		const matches = searchInContent(content, '\\d+', {
			caseSensitive: false,
			useRegex: true,
		});
		expect(applyReplacement(content, matches, '')).toBe('abc  def');
	});
});
