import { describe, it, expect } from 'vitest';
import { isSingleUrl, buildMarkdownLink } from './paste-link';

// ---------------------------------------------------------------------------
// isSingleUrl
// ---------------------------------------------------------------------------

describe('isSingleUrl', () => {
	it('http URL 为真', () => {
		expect(isSingleUrl('http://example.com')).toBe(true);
	});

	it('https URL 为真', () => {
		expect(isSingleUrl('https://example.com/path?q=1#x')).toBe(true);
	});

	it('首尾空白被忽略', () => {
		expect(isSingleUrl('  https://example.com  ')).toBe(true);
	});

	it('空字符串为假', () => {
		expect(isSingleUrl('')).toBe(false);
		expect(isSingleUrl('   ')).toBe(false);
	});

	it('非 http(s) 协议为假', () => {
		expect(isSingleUrl('ftp://example.com')).toBe(false);
		expect(isSingleUrl('example.com')).toBe(false);
		expect(isSingleUrl('obsidian://open')).toBe(false);
	});

	it('含内部空白（句子里带链接）为假', () => {
		expect(isSingleUrl('see https://example.com here')).toBe(false);
		expect(isSingleUrl('https://example.com extra')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// buildMarkdownLink（方案 A）
// ---------------------------------------------------------------------------

describe('buildMarkdownLink', () => {
	it('有选中文字 + 剪贴板是 URL → 生成 Markdown 链接', () => {
		expect(buildMarkdownLink('Obsidian', 'https://obsidian.md')).toBe(
			'[Obsidian](https://obsidian.md)'
		);
	});

	it('剪贴板 URL 首尾空白被去除', () => {
		expect(buildMarkdownLink('docs', '  https://example.com  ')).toBe(
			'[docs](https://example.com)'
		);
	});

	it('保留选中文字的原始内容（含空格）', () => {
		expect(buildMarkdownLink('my notes', 'https://example.com')).toBe(
			'[my notes](https://example.com)'
		);
	});

	it('无选中文字 → null（方案 A：不拦截）', () => {
		expect(buildMarkdownLink('', 'https://example.com')).toBeNull();
	});

	it('选区仅空白 → null', () => {
		expect(buildMarkdownLink('   ', 'https://example.com')).toBeNull();
	});

	it('剪贴板不是 URL → null（放行默认粘贴）', () => {
		expect(buildMarkdownLink('text', 'just some text')).toBeNull();
		expect(buildMarkdownLink('text', 'example.com')).toBeNull();
	});

	it('剪贴板是含空格的多 token → null', () => {
		expect(buildMarkdownLink('text', 'https://a.com https://b.com')).toBeNull();
	});
});
