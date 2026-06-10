/**
 * rename-patterns.ts — Pure functions for file renaming logic.
 * No Obsidian API dependencies — fully unit testable.
 */

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export type RenamePattern =
	// Prefix styles
	| 'date-prefix'
	| 'timestamp-prefix'
	| 'uuid-prefix'
	| 'hash-prefix'
	| 'custom-prefix'
	// Suffix styles
	| 'date-suffix'
	| 'hash-suffix'
	| 'custom-suffix'
	// Replace styles (full basename replacement)
	| 'date-uuid-replace'
	| 'date-replace'
	| 'uuid-replace'
	| 'hash-replace'
	| 'custom-replace';

export interface RenameOptions {
	date?: string;
	timestamp?: string;
	uuid?: string;
	customText?: string;
	separator?: string;
}

export interface FileRecord {
	path: string;
	basename: string;
	extension: string;
	mtimeMs: number;
	size: number;
}

export type FileTypeGroup = 'markdown' | 'image' | 'video' | 'audio' | 'pdf' | 'canvas' | 'other';

export interface RenameFilter {
	search: string;
	typeGroups: FileTypeGroup[];
	dateFrom: string | null;
	dateTo: string | null;
}

// ----------------------------------------------------------------
// formatDate
// ----------------------------------------------------------------

/**
 * Formats a Date to 'YYYY-MM-DD'. Defaults to today if no date provided.
 */
export function formatDate(date: Date = new Date()): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

// ----------------------------------------------------------------
// formatTimestamp
// ----------------------------------------------------------------

/**
 * Formats a Date to 'yyyyMMddHHmmss' (14-digit compact timestamp).
 * Defaults to now if no date provided.
 */
export function formatTimestamp(date: Date = new Date()): string {
	const y = date.getFullYear();
	const mo = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	const h = String(date.getHours()).padStart(2, '0');
	const mi = String(date.getMinutes()).padStart(2, '0');
	const s = String(date.getSeconds()).padStart(2, '0');
	return `${y}${mo}${d}${h}${mi}${s}`;
}

// ----------------------------------------------------------------
// shortHash — FNV-1a 32-bit, output as 8-char hex
// ----------------------------------------------------------------

/**
 * Returns a deterministic 8-character lowercase hex hash of the input string.
 * Uses FNV-1a 32-bit algorithm (no external dependencies).
 */
export function shortHash(input: string): string {
	let hash = 0x811c9dc5;
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		hash = (hash * 0x01000193) >>> 0;
	}
	return hash.toString(16).padStart(8, '0');
}

// ----------------------------------------------------------------
// applyPattern
// ----------------------------------------------------------------

const DEFAULT_SEPARATOR = '——';

/**
 * Applies a rename pattern to a file basename + extension.
 * Returns the complete new filename (including extension).
 */
export function applyPattern(
	basename: string,
	ext: string,
	pattern: RenamePattern,
	options: RenameOptions = {},
): string {
	const sep = options.separator ?? DEFAULT_SEPARATOR;
	const normalExt = ext === '' ? '' : ext.startsWith('.') ? ext : `.${ext}`;

	switch (pattern) {
		// ---- Prefix styles ----
		case 'date-prefix': {
			const date = options.date ?? formatDate();
			return `${date}${sep}${basename}${normalExt}`;
		}
		case 'timestamp-prefix': {
			const ts = options.timestamp ?? formatTimestamp();
			return `${ts}${sep}${basename}${normalExt}`;
		}
		case 'uuid-prefix': {
			const uuid = options.uuid ?? crypto.randomUUID();
			return `${uuid}${sep}${basename}${normalExt}`;
		}
		case 'hash-prefix': {
			return `${shortHash(basename)}${sep}${basename}${normalExt}`;
		}
		case 'custom-prefix': {
			const text = options.customText ?? '';
			return `${text}${sep}${basename}${normalExt}`;
		}
		// ---- Suffix styles ----
		case 'date-suffix': {
			const date = options.date ?? formatDate();
			return `${basename}${sep}${date}${normalExt}`;
		}
		case 'hash-suffix': {
			return `${basename}${sep}${shortHash(basename)}${normalExt}`;
		}
		case 'custom-suffix': {
			const text = options.customText ?? '';
			return `${basename}${sep}${text}${normalExt}`;
		}
		// ---- Replace styles ----
		case 'date-uuid-replace': {
			const date = options.date ?? formatDate();
			const uuid = options.uuid ?? crypto.randomUUID();
			return `${date}${sep}${uuid}${normalExt}`;
		}
		case 'date-replace': {
			const date = options.date ?? formatDate();
			return `${date}${normalExt}`;
		}
		case 'uuid-replace': {
			const uuid = options.uuid ?? crypto.randomUUID();
			return `${uuid}${normalExt}`;
		}
		case 'hash-replace': {
			return `${shortHash(basename)}${normalExt}`;
		}
		case 'custom-replace': {
			const text = options.customText ?? '';
			return `${text}${normalExt}`;
		}
	}
}

// ----------------------------------------------------------------
// resolveNameConflict
// ----------------------------------------------------------------

/**
 * Returns a filename that does not collide with any name in `taken`.
 *
 * Strategy: if `name` is taken, try `base_1.ext`, `base_2.ext`, … until a
 * free slot is found. The last dot in `name` is treated as the extension
 * separator; names with no dot are treated as having no extension.
 *
 * The `taken` set is NOT mutated.
 *
 * @param name   The desired filename (e.g. "2026-03-29.md")
 * @param taken  Set of already-used names in the same directory
 */
export function resolveNameConflict(name: string, taken: ReadonlySet<string>): string {
	if (!taken.has(name)) return name;

	const dotIdx = name.lastIndexOf('.');
	const base = dotIdx > 0 ? name.slice(0, dotIdx) : name;
	const ext  = dotIdx > 0 ? name.slice(dotIdx) : '';

	for (let i = 1; i <= 9999; i++) {
		const candidate = `${base}_${i}${ext}`;
		if (!taken.has(candidate)) return candidate;
	}
	// Practically unreachable
	return name;
}

// ----------------------------------------------------------------
// validateFilename
// ----------------------------------------------------------------

/**
 * Validates that a filename is acceptable for use on disk.
 */
export function validateFilename(name: string): { valid: boolean; error?: string } {
	if (name.length === 0) {
		return { valid: false, error: 'Filename cannot be empty.' };
	}
	if (name.includes('/')) {
		return { valid: false, error: 'Filename cannot contain "/".' };
	}
	if (name.includes('\\')) {
		return { valid: false, error: 'Filename cannot contain "\\".' };
	}
	if (name.length > 255) {
		return { valid: false, error: 'Filename cannot exceed 255 characters.' };
	}
	return { valid: true };
}

// ----------------------------------------------------------------
// getFileTypeGroup
// ----------------------------------------------------------------

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico', 'tiff', 'tif']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v', 'ogv', '3gp']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus', 'aiff', 'ape']);

/**
 * Maps a file extension (without leading dot, case-insensitive) to a FileTypeGroup.
 */
export function getFileTypeGroup(extension: string): FileTypeGroup {
	const lower = extension.toLowerCase().replace(/^\./, '');
	if (lower === 'md') return 'markdown';
	if (IMAGE_EXTENSIONS.has(lower)) return 'image';
	if (VIDEO_EXTENSIONS.has(lower)) return 'video';
	if (AUDIO_EXTENSIONS.has(lower)) return 'audio';
	if (lower === 'pdf') return 'pdf';
	if (lower === 'canvas') return 'canvas';
	return 'other';
}

// ----------------------------------------------------------------
// filterFiles
// ----------------------------------------------------------------

/**
 * Filters a list of FileRecord objects by search term, type group, and date range.
 * - search: case-insensitive match against basename
 * - typeGroups: empty array means "all types"
 * - dateFrom / dateTo: 'YYYY-MM-DD' strings (inclusive), null means no bound
 */
export function filterFiles(files: FileRecord[], filter: RenameFilter): FileRecord[] {
	const { search, typeGroups, dateFrom, dateTo } = filter;
	const dateFromMs = dateFrom ? new Date(dateFrom).getTime() : null;
	const dateToMs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
	const lowerSearch = search.toLowerCase();

	return files.filter((file) => {
		if (lowerSearch && !file.basename.toLowerCase().includes(lowerSearch)) return false;
		if (typeGroups.length > 0 && !typeGroups.includes(getFileTypeGroup(file.extension))) return false;
		if (dateFromMs !== null && file.mtimeMs < dateFromMs) return false;
		if (dateToMs !== null && file.mtimeMs > dateToMs) return false;
		return true;
	});
}

// ----------------------------------------------------------------
// paginate
// ----------------------------------------------------------------

/**
 * Returns a page slice of items. Pages are 1-indexed.
 */
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
	const start = (page - 1) * pageSize;
	return items.slice(start, start + pageSize);
}

// ----------------------------------------------------------------
// getTotalPages
// ----------------------------------------------------------------

/**
 * Calculates the total number of pages. Returns at least 1.
 */
export function getTotalPages(total: number, pageSize: number): number {
	if (total === 0) return 1;
	return Math.ceil(total / pageSize);
}
