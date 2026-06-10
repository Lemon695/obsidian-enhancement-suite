import { describe, it, expect } from 'vitest';
import {
	pickNextFootnoteNumber,
	renumberFootnotes,
	removeOrphanFootnoteDefs,
} from './footnotes-ops';

// ---------------------------------------------------------------------------
// pickNextFootnoteNumber
// ---------------------------------------------------------------------------

describe('pickNextFootnoteNumber', () => {
	it('空文档返回 1', () => {
		expect(pickNextFootnoteNumber('')).toBe(1);
	});

	it('无脚注返回 1', () => {
		expect(pickNextFootnoteNumber('hello world')).toBe(1);
	});

	it('已有 1,2 返回 3', () => {
		expect(pickNextFootnoteNumber('a[^1] b[^2]\n[^1]: x\n[^2]: y')).toBe(3);
	});

	it('返回最小未使用编号（有空洞）', () => {
		expect(pickNextFootnoteNumber('a[^1] b[^3]')).toBe(2);
	});

	it('忽略命名标签', () => {
		expect(pickNextFootnoteNumber('a[^note] b[^1]')).toBe(2);
	});
});

// ---------------------------------------------------------------------------
// renumberFootnotes
// ---------------------------------------------------------------------------

describe('renumberFootnotes', () => {
	it('无脚注时原样返回，count=0', () => {
		const r = renumberFootnotes('hello');
		expect(r.content).toBe('hello');
		expect(r.count).toBe(0);
	});

	it('按首次出现顺序重编', () => {
		const input = 'x[^3] y[^7]\n[^3]: a\n[^7]: b';
		const r = renumberFootnotes(input);
		expect(r.count).toBe(2);
		expect(r.content).toBe('x[^1] y[^2]\n[^1]: a\n[^2]: b');
	});

	it('交换型重编不互相覆盖（2,1 → 1,2）', () => {
		const input = 'first[^2] second[^1]\n[^2]: a\n[^1]: b';
		const r = renumberFootnotes(input);
		// [^2] 首次出现 → 1；[^1] 后出现 → 2
		expect(r.content).toBe('first[^1] second[^2]\n[^1]: a\n[^2]: b');
	});

	it('命名标签也参与重编', () => {
		const input = 'a[^foo] b[^bar]\n[^foo]: x\n[^bar]: y';
		const r = renumberFootnotes(input);
		expect(r.content).toBe('a[^1] b[^2]\n[^1]: x\n[^2]: y');
	});

	it('不修改入参', () => {
		const input = 'x[^3]\n[^3]: a';
		const snapshot = input;
		renumberFootnotes(input);
		expect(input).toBe(snapshot);
	});
});

// ---------------------------------------------------------------------------
// removeOrphanFootnoteDefs
// ---------------------------------------------------------------------------

describe('removeOrphanFootnoteDefs', () => {
	it('无孤立定义时原样返回，removed=0', () => {
		const input = 'a[^1]\n[^1]: x';
		const r = removeOrphanFootnoteDefs(input);
		expect(r.content).toBe(input);
		expect(r.removed).toBe(0);
	});

	it('删除有定义无引用的行', () => {
		const input = 'a[^1]\n[^1]: used\n[^2]: orphan';
		const r = removeOrphanFootnoteDefs(input);
		expect(r.removed).toBe(1);
		expect(r.content).toBe('a[^1]\n[^1]: used');
	});

	it('保留被引用的定义', () => {
		const input = 'a[^1] b[^2]\n[^1]: x\n[^2]: y';
		const r = removeOrphanFootnoteDefs(input);
		expect(r.removed).toBe(0);
		expect(r.content).toBe(input);
	});

	it('不修改入参', () => {
		const input = 'a[^1]\n[^1]: x\n[^9]: orphan';
		const snapshot = input;
		removeOrphanFootnoteDefs(input);
		expect(input).toBe(snapshot);
	});
});
