import { describe, it, expect } from 'vitest';
import { filterFilesByScope } from './batch-filter';

// テスト用のダミーファイルレコード
const files = [
	{ path: 'notes/a.md', tags: ['#project', '#active'] },
	{ path: 'notes/b.md', tags: ['#project'] },
	{ path: 'notes/sub/c.md', tags: ['#active'] },
	{ path: 'archive/d.md', tags: [] },
	{ path: 'e.md', tags: ['#project', '#done'] },
];

describe('filterFilesByScope', () => {
	// ----------------------------------------------------------------
	// scope = 'vault'
	// ----------------------------------------------------------------
	describe('vault scope', () => {
		it('returns all files', () => {
			const result = filterFilesByScope(files, 'vault', null, '');
			expect(result).toHaveLength(5);
		});

		it('ignores currentFolderPath', () => {
			const result = filterFilesByScope(files, 'vault', 'notes', '');
			expect(result).toHaveLength(5);
		});
	});

	// ----------------------------------------------------------------
	// scope = 'folder'
	// ----------------------------------------------------------------
	describe('folder scope', () => {
		it('returns files in the given folder (non-recursive)', () => {
			const result = filterFilesByScope(files, 'folder', 'notes', '');
			// notes/a.md and notes/b.md are direct children; notes/sub/c.md is nested
			expect(result.map((f) => f.path)).toEqual(
				expect.arrayContaining(['notes/a.md', 'notes/b.md'])
			);
		});

		it('does not include files in subdirectories', () => {
			const result = filterFilesByScope(files, 'folder', 'notes', '');
			expect(result.map((f) => f.path)).not.toContain('notes/sub/c.md');
		});

		it('does not include files from other folders', () => {
			const result = filterFilesByScope(files, 'folder', 'notes', '');
			expect(result.map((f) => f.path)).not.toContain('archive/d.md');
		});

		it('returns files in subdirectory when specified', () => {
			const result = filterFilesByScope(files, 'folder', 'notes/sub', '');
			expect(result.map((f) => f.path)).toEqual(['notes/sub/c.md']);
		});

		it('returns all files when currentFolderPath is null (falls back to vault)', () => {
			const result = filterFilesByScope(files, 'folder', null, '');
			expect(result).toHaveLength(5);
		});

		it('returns root-level files when currentFolderPath is empty string', () => {
			const result = filterFilesByScope(files, 'folder', '', '');
			// e.md is in vault root (no folder prefix)
			expect(result.map((f) => f.path)).toEqual(['e.md']);
		});
	});

	// ----------------------------------------------------------------
	// scope = 'tag'
	// ----------------------------------------------------------------
	describe('tag scope', () => {
		it('filters by exact tag with # prefix', () => {
			const result = filterFilesByScope(files, 'tag', null, '#project');
			expect(result.map((f) => f.path)).toEqual(
				expect.arrayContaining(['notes/a.md', 'notes/b.md', 'e.md'])
			);
			expect(result).toHaveLength(3);
		});

		it('normalises tag without # prefix by adding it', () => {
			const result = filterFilesByScope(files, 'tag', null, 'project');
			expect(result).toHaveLength(3);
		});

		it('returns empty array when no files match', () => {
			const result = filterFilesByScope(files, 'tag', null, '#nonexistent');
			expect(result).toHaveLength(0);
		});

		it('returns empty array when targetTag is empty string', () => {
			const result = filterFilesByScope(files, 'tag', null, '');
			expect(result).toHaveLength(0);
		});

		it('is case-sensitive for tag matching', () => {
			const result = filterFilesByScope(files, 'tag', null, '#Project');
			expect(result).toHaveLength(0);
		});
	});
});
