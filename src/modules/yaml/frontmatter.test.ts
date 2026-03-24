import { describe, it, expect } from 'vitest';
import {
	extractFrontmatter,
	validateFrontmatterYaml,
	parseFrontmatterFields,
	hasFrontmatter,
} from './frontmatter';

// ---------------------------------------------------------------------------
// hasFrontmatter
// ---------------------------------------------------------------------------

describe('hasFrontmatter', () => {
	it('以 ---\\n 开头时返回 true', () => {
		expect(hasFrontmatter('---\ntitle: test\n---\n')).toBe(true);
	});

	it('以 ---\\r\\n 开头时返回 true', () => {
		expect(hasFrontmatter('---\r\ntitle: test\r\n---\r\n')).toBe(true);
	});

	it('不以 --- 开头时返回 false', () => {
		expect(hasFrontmatter('# Hello\n')).toBe(false);
	});

	it('空字符串返回 false', () => {
		expect(hasFrontmatter('')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// extractFrontmatter
// ---------------------------------------------------------------------------

describe('extractFrontmatter', () => {
	it('成功提取有效 frontmatter', () => {
		const doc = '---\ntitle: Hello\nauthor: Alice\n---\n# Body';
		const result = extractFrontmatter(doc);
		expect(result).not.toBeNull();
		expect(result?.content).toBe('title: Hello\nauthor: Alice');
		expect(result?.startLine).toBe(0);
		expect(result?.endLine).toBe(3);
	});

	it('文档不以 --- 开头时返回 null', () => {
		expect(extractFrontmatter('# No frontmatter')).toBeNull();
	});

	it('无闭合 --- 时返回 null', () => {
		expect(extractFrontmatter('---\ntitle: test\n# Body')).toBeNull();
	});

	it('空 frontmatter（两个 --- 相邻）返回空内容', () => {
		const doc = '---\n---\n# Body';
		const result = extractFrontmatter(doc);
		expect(result).not.toBeNull();
		expect(result?.content).toBe('');
	});
});

// ---------------------------------------------------------------------------
// parseFrontmatterFields
// ---------------------------------------------------------------------------

describe('parseFrontmatterFields', () => {
	it('解析简单键值对', () => {
		const yaml = 'title: Hello\ndate: 2024-01-01\ntags: [a, b]';
		const fields = parseFrontmatterFields(yaml);
		expect(fields).toHaveLength(3);
		expect(fields[0]?.key).toBe('title');
		expect(fields[0]?.rawValue).toBe('Hello');
	});

	it('跳过空行与注释行', () => {
		const yaml = '\n# Comment\ntitle: Test\n';
		const fields = parseFrontmatterFields(yaml);
		expect(fields).toHaveLength(1);
		expect(fields[0]?.key).toBe('title');
	});

	it('跳过缩进行（多行值）', () => {
		const yaml = 'description: |\n  line one\n  line two\ntitle: Hi';
		const fields = parseFrontmatterFields(yaml);
		// 只有顶层键
		const keys = fields.map((f) => f.key);
		expect(keys).toContain('description');
		expect(keys).toContain('title');
		expect(keys).not.toContain('line one');
	});

	it('空内容返回空数组', () => {
		expect(parseFrontmatterFields('')).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// validateFrontmatterYaml
// ---------------------------------------------------------------------------

describe('validateFrontmatterYaml — 合法内容', () => {
	it('正常键值对无错误', () => {
		const yaml = 'title: Hello\ndate: 2024-01-01\ntags: [a, b]';
		expect(validateFrontmatterYaml(yaml)).toHaveLength(0);
	});

	it('空内容无错误', () => {
		expect(validateFrontmatterYaml('')).toHaveLength(0);
	});

	it('只有注释行无错误', () => {
		expect(validateFrontmatterYaml('# just a comment')).toHaveLength(0);
	});

	it('列表项行无错误', () => {
		const yaml = 'tags:\n  - apple\n  - banana';
		expect(validateFrontmatterYaml(yaml)).toHaveLength(0);
	});
});

describe('validateFrontmatterYaml — 非法内容', () => {
	it('缺少冒号的行报错', () => {
		const errors = validateFrontmatterYaml('invalid line without colon');
		expect(errors.length).toBeGreaterThan(0);
		expect(errors[0]?.message).toMatch(/colon/i);
	});

	it('重复键报错', () => {
		const yaml = 'title: First\ntitle: Second';
		const errors = validateFrontmatterYaml(yaml);
		expect(errors.length).toBeGreaterThan(0);
		expect(errors[0]?.message).toMatch(/duplicate/i);
	});

	it('键包含非法字符报错', () => {
		const yaml = 'ti{tle}: test';
		const errors = validateFrontmatterYaml(yaml);
		expect(errors.length).toBeGreaterThan(0);
		expect(errors[0]?.message).toMatch(/invalid/i);
	});
});
