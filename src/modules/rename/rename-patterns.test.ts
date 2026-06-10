import { describe, it, expect } from 'vitest';
import {
	applyPattern,
	validateFilename,
	formatDate,
	formatTimestamp,
	shortHash,
	getFileTypeGroup,
	filterFiles,
	paginate,
	getTotalPages,
	resolveNameConflict,
	type FileRecord,
	type RenameFilter,
} from './rename-patterns';

// ----------------------------------------------------------------
// 测试用的固定日期（避免测试依赖当前时间）
// ----------------------------------------------------------------
const FIXED_DATE_STR = '2026-03-29';

// ----------------------------------------------------------------
// 测试数据
// ----------------------------------------------------------------
function makeFile(override: Partial<FileRecord> = {}): FileRecord {
	return {
		path: 'folder/note.md',
		basename: 'note',
		extension: 'md',
		mtimeMs: new Date('2026-03-01').getTime(),
		size: 1024,
		...override,
	};
}

const SAMPLE_FILES: FileRecord[] = [
	makeFile({ path: 'a.md', basename: 'a', extension: 'md', mtimeMs: new Date('2026-01-10').getTime() }),
	makeFile({ path: 'b.png', basename: 'b', extension: 'png', mtimeMs: new Date('2026-02-15').getTime() }),
	makeFile({ path: 'c.pdf', basename: 'c', extension: 'pdf', mtimeMs: new Date('2026-03-20').getTime() }),
	makeFile({ path: 'd.jpg', basename: 'weekly note', extension: 'jpg', mtimeMs: new Date('2026-03-25').getTime() }),
	makeFile({ path: 'e.txt', basename: 'readme', extension: 'txt', mtimeMs: new Date('2026-03-29').getTime() }),
];

// ----------------------------------------------------------------
// formatDate
// ----------------------------------------------------------------
describe('formatDate', () => {
	it('formats a Date object to YYYY-MM-DD', () => {
		expect(formatDate(new Date('2026-03-29'))).toBe('2026-03-29');
	});

	it('pads single-digit month and day', () => {
		expect(formatDate(new Date('2026-01-05'))).toBe('2026-01-05');
	});

	it('returns a string matching YYYY-MM-DD when called with no arg', () => {
		expect(formatDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});

// ----------------------------------------------------------------
// shortHash
// ----------------------------------------------------------------
describe('shortHash', () => {
	it('returns an 8-character hex string', () => {
		expect(shortHash('hello')).toMatch(/^[0-9a-f]{8}$/);
	});

	it('is deterministic — same input always produces same output', () => {
		expect(shortHash('my-note')).toBe(shortHash('my-note'));
	});

	it('produces different hashes for different inputs', () => {
		expect(shortHash('note-a')).not.toBe(shortHash('note-b'));
	});
});

// ----------------------------------------------------------------
// applyPattern — date-prefix
// ----------------------------------------------------------------
describe('applyPattern — date-prefix', () => {
	it('prepends date and separator to basename + ext', () => {
		expect(applyPattern('note', 'md', 'date-prefix', { date: FIXED_DATE_STR }))
			.toBe('2026-03-29——note.md');
	});

	it('works with image extension', () => {
		expect(applyPattern('photo', 'png', 'date-prefix', { date: FIXED_DATE_STR }))
			.toBe('2026-03-29——photo.png');
	});

	it('uses today when date is not provided', () => {
		const result = applyPattern('note', 'md', 'date-prefix');
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}——note\.md$/);
	});
});

// ----------------------------------------------------------------
// applyPattern — date-suffix
// ----------------------------------------------------------------
describe('applyPattern — date-suffix', () => {
	it('appends separator and date after basename', () => {
		expect(applyPattern('note', 'md', 'date-suffix', { date: FIXED_DATE_STR }))
			.toBe('note——2026-03-29.md');
	});

	it('works with pdf extension', () => {
		expect(applyPattern('report', 'pdf', 'date-suffix', { date: FIXED_DATE_STR }))
			.toBe('report——2026-03-29.pdf');
	});
});

// ----------------------------------------------------------------
// applyPattern — uuid-prefix
// ----------------------------------------------------------------
describe('applyPattern — uuid-prefix', () => {
	it('prepends a fixed UUID when provided', () => {
		const uuid = '123e4567-e89b-12d3-a456-426614174000';
		expect(applyPattern('note', 'md', 'uuid-prefix', { uuid }))
			.toBe('123e4567-e89b-12d3-a456-426614174000——note.md');
	});

	it('generates a UUID when none is provided', () => {
		const result = applyPattern('note', 'md', 'uuid-prefix');
		// UUID v4 pattern + separator + basename
		expect(result).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}——note\.md$/i
		);
	});

	it('two calls without fixed UUID produce different names', () => {
		const r1 = applyPattern('note', 'md', 'uuid-prefix');
		const r2 = applyPattern('note', 'md', 'uuid-prefix');
		expect(r1).not.toBe(r2);
	});
});

// ----------------------------------------------------------------
// applyPattern — hash-prefix
// ----------------------------------------------------------------
describe('applyPattern — hash-prefix', () => {
	it('prepends an 8-char hex hash of the basename', () => {
		const result = applyPattern('note', 'md', 'hash-prefix');
		expect(result).toMatch(/^[0-9a-f]{8}——note\.md$/);
	});

	it('is deterministic — same basename always produces same output', () => {
		expect(applyPattern('note', 'md', 'hash-prefix'))
			.toBe(applyPattern('note', 'md', 'hash-prefix'));
	});

	it('different basenames produce different hashes', () => {
		expect(applyPattern('alpha', 'md', 'hash-prefix'))
			.not.toBe(applyPattern('beta', 'md', 'hash-prefix'));
	});
});

// ----------------------------------------------------------------
// applyPattern — custom-prefix
// ----------------------------------------------------------------
describe('applyPattern — custom-prefix', () => {
	it('prepends custom text and separator', () => {
		expect(applyPattern('note', 'md', 'custom-prefix', { customText: 'PROJECT' }))
			.toBe('PROJECT——note.md');
	});

	it('returns just separator + name when customText is empty', () => {
		expect(applyPattern('note', 'md', 'custom-prefix', { customText: '' }))
			.toBe('——note.md');
	});
});

// ----------------------------------------------------------------
// applyPattern — custom-suffix
// ----------------------------------------------------------------
describe('applyPattern — custom-suffix', () => {
	it('appends separator and custom text after basename', () => {
		expect(applyPattern('note', 'md', 'custom-suffix', { customText: 'v2' }))
			.toBe('note——v2.md');
	});
});

// ----------------------------------------------------------------
// applyPattern — extension handling
// ----------------------------------------------------------------
describe('applyPattern — extension handling', () => {
	it('handles extension without leading dot', () => {
		expect(applyPattern('note', 'md', 'date-prefix', { date: FIXED_DATE_STR }))
			.toBe('2026-03-29——note.md');
	});

	it('handles extension with leading dot', () => {
		expect(applyPattern('note', '.md', 'date-prefix', { date: FIXED_DATE_STR }))
			.toBe('2026-03-29——note.md');
	});

	it('handles empty extension (no dot appended)', () => {
		expect(applyPattern('Makefile', '', 'date-prefix', { date: FIXED_DATE_STR }))
			.toBe('2026-03-29——Makefile');
	});
});

// ----------------------------------------------------------------
// applyPattern — date-uuid-replace
// ----------------------------------------------------------------
describe('applyPattern — date-uuid-replace', () => {
	it('produces date + separator + uuid filename with extension', () => {
		const uuid = '123e4567-e89b-12d3-a456-426614174000';
		expect(applyPattern('note', 'md', 'date-uuid-replace', { date: FIXED_DATE_STR, uuid }))
			.toBe('2026-03-29——123e4567-e89b-12d3-a456-426614174000.md');
	});

	it('generates uuid when none provided, format matches date——uuid.ext', () => {
		const result = applyPattern('note', 'md', 'date-uuid-replace', { date: FIXED_DATE_STR });
		expect(result).toMatch(
			/^2026-03-29——[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.md$/i
		);
	});

	it('ignores original basename entirely (replace mode)', () => {
		const uuid = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
		const result = applyPattern('any-original-name', 'txt', 'date-uuid-replace', { date: FIXED_DATE_STR, uuid });
		expect(result).not.toContain('any-original-name');
		expect(result).toBe('2026-03-29——aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.txt');
	});
});

// ----------------------------------------------------------------
// validateFilename
// ----------------------------------------------------------------
describe('validateFilename', () => {
	it('returns valid for a normal filename', () => {
		expect(validateFilename('2026-03-29——note.md').valid).toBe(true);
	});

	it('returns invalid for empty string', () => {
		expect(validateFilename('').valid).toBe(false);
	});

	it('returns invalid for names containing path separator /', () => {
		expect(validateFilename('folder/file.md').valid).toBe(false);
	});

	it('returns invalid for names containing backslash', () => {
		expect(validateFilename('folder\\file.md').valid).toBe(false);
	});

	it('returns invalid for names exceeding 255 characters', () => {
		expect(validateFilename('a'.repeat(256)).valid).toBe(false);
	});

	it('returns an error message when invalid', () => {
		const result = validateFilename('');
		expect(result.error).toBeTruthy();
	});
});

// ----------------------------------------------------------------
// getFileTypeGroup
// ----------------------------------------------------------------
describe('getFileTypeGroup', () => {
	it('classifies md as markdown', () => {
		expect(getFileTypeGroup('md')).toBe('markdown');
	});

	it('classifies png jpg gif svg webp as image', () => {
		['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].forEach((ext) => {
			expect(getFileTypeGroup(ext)).toBe('image');
		});
	});

	it('classifies pdf as pdf', () => {
		expect(getFileTypeGroup('pdf')).toBe('pdf');
	});

	it('classifies video extensions as video', () => {
		['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v'].forEach((ext) => {
			expect(getFileTypeGroup(ext)).toBe('video');
		});
	});

	it('classifies audio extensions as audio', () => {
		['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus'].forEach((ext) => {
			expect(getFileTypeGroup(ext)).toBe('audio');
		});
	});

	it('classifies canvas as canvas', () => {
		expect(getFileTypeGroup('canvas')).toBe('canvas');
	});

	it('classifies unknown extensions as other', () => {
		expect(getFileTypeGroup('txt')).toBe('other');
		expect(getFileTypeGroup('zip')).toBe('other');
	});

	it('is case-insensitive', () => {
		expect(getFileTypeGroup('PNG')).toBe('image');
		expect(getFileTypeGroup('MD')).toBe('markdown');
		expect(getFileTypeGroup('MP4')).toBe('video');
		expect(getFileTypeGroup('MP3')).toBe('audio');
		expect(getFileTypeGroup('CANVAS')).toBe('canvas');
	});
});

// ----------------------------------------------------------------
// filterFiles
// ----------------------------------------------------------------
describe('filterFiles', () => {
	const emptyFilter: RenameFilter = {
		search: '',
		typeGroups: [],
		dateFrom: null,
		dateTo: null,
	};

	it('returns all files when filter is empty', () => {
		expect(filterFiles(SAMPLE_FILES, emptyFilter)).toHaveLength(SAMPLE_FILES.length);
	});

	it('filters by search term (case-insensitive)', () => {
		const result = filterFiles(SAMPLE_FILES, { ...emptyFilter, search: 'weekly' });
		expect(result).toHaveLength(1);
		expect(result[0]?.basename).toBe('weekly note');
	});

	it('filters by type group — markdown only', () => {
		const result = filterFiles(SAMPLE_FILES, { ...emptyFilter, typeGroups: ['markdown'] });
		expect(result).toHaveLength(1);
		expect(result[0]?.extension).toBe('md');
	});

	it('filters by multiple type groups', () => {
		const result = filterFiles(SAMPLE_FILES, { ...emptyFilter, typeGroups: ['image', 'pdf'] });
		expect(result).toHaveLength(3); // b.png, c.pdf, d.jpg
	});

	it('filters by dateFrom (inclusive)', () => {
		const result = filterFiles(SAMPLE_FILES, {
			...emptyFilter,
			dateFrom: '2026-03-01',
		});
		// c.pdf(03-20), d.jpg(03-25), e.txt(03-29) → 3 files
		expect(result).toHaveLength(3);
	});

	it('filters by dateTo (inclusive)', () => {
		const result = filterFiles(SAMPLE_FILES, {
			...emptyFilter,
			dateTo: '2026-01-31',
		});
		// a.md(01-10) → 1 file
		expect(result).toHaveLength(1);
	});

	it('filters by combined search + type', () => {
		const result = filterFiles(SAMPLE_FILES, {
			...emptyFilter,
			search: 'b',
			typeGroups: ['image'],
		});
		expect(result).toHaveLength(1);
		expect(result[0]?.basename).toBe('b');
	});
});

// ----------------------------------------------------------------
// paginate
// ----------------------------------------------------------------
describe('paginate', () => {
	const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

	it('returns the first page', () => {
		expect(paginate(items, 1, 3)).toEqual([1, 2, 3]);
	});

	it('returns the second page', () => {
		expect(paginate(items, 2, 3)).toEqual([4, 5, 6]);
	});

	it('returns a partial last page', () => {
		expect(paginate(items, 4, 3)).toEqual([10]);
	});

	it('returns empty array for out-of-range page', () => {
		expect(paginate(items, 5, 3)).toEqual([]);
	});
});

// ----------------------------------------------------------------
// getTotalPages
// ----------------------------------------------------------------
describe('getTotalPages', () => {
	it('returns correct page count for exact division', () => {
		expect(getTotalPages(9, 3)).toBe(3);
	});

	it('rounds up for partial last page', () => {
		expect(getTotalPages(10, 3)).toBe(4);
	});

	it('returns 1 for 0 items', () => {
		expect(getTotalPages(0, 20)).toBe(1);
	});
});

// ----------------------------------------------------------------
// formatTimestamp
// ----------------------------------------------------------------
describe('formatTimestamp', () => {
	it('formats a Date to yyyyMMddHHmmss', () => {
		expect(formatTimestamp(new Date(2026, 2, 29, 12, 0, 0))).toBe('20260329120000');
	});

	it('pads single-digit month, day, hour, minute, second', () => {
		expect(formatTimestamp(new Date(2026, 0, 5, 9, 3, 1))).toBe('20260105090301');
	});

	it('returns a 14-digit string when called with no arg', () => {
		expect(formatTimestamp()).toMatch(/^\d{14}$/);
	});
});

// ----------------------------------------------------------------
// applyPattern — date-replace
// ----------------------------------------------------------------
describe('applyPattern — date-replace', () => {
	it('replaces basename entirely with date', () => {
		expect(applyPattern('note', 'md', 'date-replace', { date: FIXED_DATE_STR }))
			.toBe('2026-03-29.md');
	});

	it('works with empty extension', () => {
		expect(applyPattern('note', '', 'date-replace', { date: FIXED_DATE_STR }))
			.toBe('2026-03-29');
	});
});

// ----------------------------------------------------------------
// applyPattern — timestamp-prefix
// ----------------------------------------------------------------
describe('applyPattern — timestamp-prefix', () => {
	it('prepends a fixed timestamp when provided', () => {
		expect(applyPattern('note', 'md', 'timestamp-prefix', { timestamp: '20260329120000' }))
			.toBe('20260329120000——note.md');
	});

	it('generates a 14-digit timestamp when none is provided', () => {
		expect(applyPattern('note', 'md', 'timestamp-prefix'))
			.toMatch(/^\d{14}——note\.md$/);
	});
});

// ----------------------------------------------------------------
// applyPattern — uuid-replace
// ----------------------------------------------------------------
describe('applyPattern — uuid-replace', () => {
	it('replaces basename with a fixed UUID when provided', () => {
		const uuid = '123e4567-e89b-12d3-a456-426614174000';
		expect(applyPattern('note', 'md', 'uuid-replace', { uuid }))
			.toBe('123e4567-e89b-12d3-a456-426614174000.md');
	});

	it('generates a UUID when none is provided', () => {
		expect(applyPattern('note', 'md', 'uuid-replace'))
			.toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.md$/i);
	});

	it('two calls without fixed UUID produce different names', () => {
		expect(applyPattern('note', 'md', 'uuid-replace'))
			.not.toBe(applyPattern('note', 'md', 'uuid-replace'));
	});
});

// ----------------------------------------------------------------
// applyPattern — hash-suffix
// ----------------------------------------------------------------
describe('applyPattern — hash-suffix', () => {
	it('appends separator and 8-char hex hash after basename', () => {
		expect(applyPattern('note', 'md', 'hash-suffix'))
			.toMatch(/^note——[0-9a-f]{8}\.md$/);
	});

	it('is deterministic', () => {
		expect(applyPattern('note', 'md', 'hash-suffix'))
			.toBe(applyPattern('note', 'md', 'hash-suffix'));
	});

	it('different basenames produce different results', () => {
		expect(applyPattern('alpha', 'md', 'hash-suffix'))
			.not.toBe(applyPattern('beta', 'md', 'hash-suffix'));
	});
});

// ----------------------------------------------------------------
// applyPattern — hash-replace
// ----------------------------------------------------------------
describe('applyPattern — hash-replace', () => {
	it('replaces basename with 8-char hex hash', () => {
		expect(applyPattern('note', 'md', 'hash-replace'))
			.toMatch(/^[0-9a-f]{8}\.md$/);
	});

	it('is deterministic', () => {
		expect(applyPattern('note', 'md', 'hash-replace'))
			.toBe(applyPattern('note', 'md', 'hash-replace'));
	});

	it('different basenames produce different hashes', () => {
		expect(applyPattern('alpha', 'md', 'hash-replace'))
			.not.toBe(applyPattern('beta', 'md', 'hash-replace'));
	});
});

// ----------------------------------------------------------------
// applyPattern — custom-replace
// ----------------------------------------------------------------
describe('applyPattern — custom-replace', () => {
	it('replaces basename with custom text', () => {
		expect(applyPattern('note', 'md', 'custom-replace', { customText: 'my-new-name' }))
			.toBe('my-new-name.md');
	});

	it('returns just extension when customText is empty', () => {
		expect(applyPattern('note', 'md', 'custom-replace', { customText: '' }))
			.toBe('.md');
	});
});

// ----------------------------------------------------------------
// resolveNameConflict
// ----------------------------------------------------------------
describe('resolveNameConflict', () => {
	it('returns the original name when no existing names conflict', () => {
		expect(resolveNameConflict('note.md', new Set())).toBe('note.md');
	});

	it('appends _1 when the original name is taken', () => {
		expect(resolveNameConflict('note.md', new Set(['note.md']))).toBe('note_1.md');
	});

	it('skips to _2 when _1 is also taken', () => {
		expect(resolveNameConflict('note.md', new Set(['note.md', 'note_1.md']))).toBe('note_2.md');
	});

	it('finds the first available slot across many taken names', () => {
		const taken = new Set(['note.md', 'note_1.md', 'note_2.md', 'note_3.md']);
		expect(resolveNameConflict('note.md', taken)).toBe('note_4.md');
	});

	it('handles names without extension', () => {
		expect(resolveNameConflict('README', new Set(['README']))).toBe('README_1');
	});

	it('handles names with multiple dots correctly', () => {
		// Only the last dot is treated as the extension separator
		expect(resolveNameConflict('my.notes.md', new Set(['my.notes.md']))).toBe('my.notes_1.md');
	});

	it('does not mutate the taken set', () => {
		const taken = new Set(['note.md']);
		resolveNameConflict('note.md', taken);
		expect(taken.size).toBe(1);
	});

	it('returns original name immediately when set is empty', () => {
		expect(resolveNameConflict('2026-03-29.md', new Set())).toBe('2026-03-29.md');
	});
});
