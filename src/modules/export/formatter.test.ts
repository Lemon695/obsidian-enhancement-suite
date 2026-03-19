import { describe, it, expect } from 'vitest';
import { cleanMarkdownForExport, markdownToHtml, escapeHtml } from './formatter';

// ---------------------------------------------------------------------------
// cleanMarkdownForExport
// ---------------------------------------------------------------------------

describe('cleanMarkdownForExport — 移除 Obsidian 专有语法', () => {
	it('移除 YAML frontmatter', () => {
		const content = '---\ntitle: Test\n---\n# Hello';
		const result = cleanMarkdownForExport(content);
		expect(result).not.toContain('---');
		expect(result).toContain('# Hello');
	});

	it('移除嵌入引用 ![[filename]]', () => {
		const result = cleanMarkdownForExport('Text ![[image.png]] more');
		expect(result).not.toContain('![[');
		expect(result).toContain('Text');
		expect(result).toContain('more');
	});

	it('将带别名 wiki 链接转换为 Markdown 链接', () => {
		const result = cleanMarkdownForExport('See [[target|alias]] here');
		expect(result).toContain('[alias](target)');
		expect(result).not.toContain('[[');
	});

	it('将普通 wiki 链接转换为纯文本', () => {
		const result = cleanMarkdownForExport('See [[MyNote]] here');
		expect(result).toContain('MyNote');
		expect(result).not.toContain('[[');
	});

	it('移除高亮标记 ==text==', () => {
		const result = cleanMarkdownForExport('This is ==highlighted== text');
		expect(result).toContain('highlighted');
		expect(result).not.toContain('==');
	});

	it('保留标准 Markdown 链接', () => {
		const result = cleanMarkdownForExport('[Click here](https://example.com)');
		expect(result).toContain('[Click here](https://example.com)');
	});

	it('不含 Obsidian 特有语法时内容不变（除 trim）', () => {
		const content = '# Title\n\nParagraph with **bold** and _italic_.';
		expect(cleanMarkdownForExport(content)).toBe(content);
	});
});

// ---------------------------------------------------------------------------
// escapeHtml
// ---------------------------------------------------------------------------

describe('escapeHtml', () => {
	it('转义 & < > " \'', () => {
		expect(escapeHtml('&<>"\''))
			.toBe('&amp;&lt;&gt;&quot;&#39;');
	});

	it('无特殊字符时不改变', () => {
		expect(escapeHtml('hello world')).toBe('hello world');
	});
});

// ---------------------------------------------------------------------------
// markdownToHtml
// ---------------------------------------------------------------------------

describe('markdownToHtml — 生成合法 HTML 文档', () => {
	it('返回字符串以 <!DOCTYPE html> 开头', () => {
		const html = markdownToHtml('Test', '# Hello');
		expect(html.trimStart().startsWith('<!DOCTYPE html>')).toBe(true);
	});

	it('标题包含在 <title> 中（并已转义）', () => {
		const html = markdownToHtml('My <Page>', '');
		expect(html).toContain('<title>My &lt;Page&gt;</title>');
	});

	it('转换 h1 标题', () => {
		const html = markdownToHtml('T', '# Main Title');
		expect(html).toContain('<h1>Main Title</h1>');
	});

	it('转换 h2 标题', () => {
		const html = markdownToHtml('T', '## Sub Title');
		expect(html).toContain('<h2>Sub Title</h2>');
	});

	it('转换粗体', () => {
		const html = markdownToHtml('T', '**bold text**');
		expect(html).toContain('<strong>bold text</strong>');
	});

	it('转换斜体', () => {
		const html = markdownToHtml('T', '*italic text*');
		expect(html).toContain('<em>italic text</em>');
	});

	it('转换内联代码', () => {
		const html = markdownToHtml('T', '`code here`');
		expect(html).toContain('<code>code here</code>');
	});

	it('转换标准链接', () => {
		const html = markdownToHtml('T', '[Click](https://example.com)');
		expect(html).toContain('<a href="https://example.com">Click</a>');
	});

	it('转换水平分隔线', () => {
		const html = markdownToHtml('T', '---');
		expect(html).toContain('<hr>');
	});
});
