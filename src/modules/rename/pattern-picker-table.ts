/**
 * pattern-picker-table.ts — Shared UI component for selecting a rename pattern.
 *
 * Renders a scrollable table listing all 12 rename patterns with live preview.
 * Used by both QuickRenameModal and BatchRenameConfirmModal.
 *
 * No Obsidian API dependencies except HTMLElement manipulation.
 */

import {
	applyPattern,
	formatDate,
	formatTimestamp,
	type RenamePattern,
} from './rename-patterns';

// ----------------------------------------------------------------
// Pattern definitions
// ----------------------------------------------------------------

export interface PatternDef {
	id: RenamePattern;
	type: 'prefix' | 'suffix' | 'replace';
	needsCustom: boolean;
}

export const ALL_PATTERNS: PatternDef[] = [
	// Prefix
	{ id: 'date-prefix',      type: 'prefix',  needsCustom: false },
	{ id: 'timestamp-prefix', type: 'prefix',  needsCustom: false },
	{ id: 'uuid-prefix',      type: 'prefix',  needsCustom: false },
	{ id: 'hash-prefix',      type: 'prefix',  needsCustom: false },
	{ id: 'custom-prefix',    type: 'prefix',  needsCustom: true  },
	// Suffix
	{ id: 'date-suffix',      type: 'suffix',  needsCustom: false },
	{ id: 'hash-suffix',      type: 'suffix',  needsCustom: false },
	{ id: 'custom-suffix',    type: 'suffix',  needsCustom: true  },
	// Replace
	{ id: 'date-uuid-replace', type: 'replace', needsCustom: false },
	{ id: 'date-replace',      type: 'replace', needsCustom: false },
	{ id: 'uuid-replace',     type: 'replace', needsCustom: false },
	{ id: 'hash-replace',     type: 'replace', needsCustom: false },
	{ id: 'custom-replace',   type: 'replace', needsCustom: true  },
];

// ----------------------------------------------------------------
// i18n interface
// ----------------------------------------------------------------

export interface PatternPickerI18n {
	patterns: Record<string, string>;
	typePrefix: string;
	typeSuffix: string;
	typeReplace: string;
	customPlaceholder: string;
}

// ----------------------------------------------------------------
// PatternPickerTable
// ----------------------------------------------------------------

/**
 * Shared pattern-picker UI component.
 *
 * Usage:
 *   const table = new PatternPickerTable(basename, ext, i18n);
 *   table.render(containerEl, 'date-prefix');
 *   table.setOnChange(() => console.log(table.getPattern()));
 *   // Keyboard nav:
 *   table.selectNext();
 *   table.selectPrev();
 */
export class PatternPickerTable {
	// Pre-generated stable values (one per modal open)
	private readonly previewDate      = formatDate();
	private readonly previewTimestamp = formatTimestamp();
	private readonly previewUuid      = crypto.randomUUID();

	private selectedIndex = 0;

	/** Per-row custom text input state (row index → input el) */
	private readonly customInputs = new Map<number, HTMLInputElement>();

	private rowEls: HTMLTableRowElement[] = [];
	private onChange?: () => void;

	constructor(
		private readonly basename: string,
		private readonly extension: string,
		private readonly i18n: PatternPickerI18n,
	) {}

	// ----------------------------------------------------------------
	// Public API
	// ----------------------------------------------------------------

	render(containerEl: HTMLElement, defaultPattern: RenamePattern = 'date-prefix'): void {
		const defaultIdx = ALL_PATTERNS.findIndex((p) => p.id === defaultPattern);
		this.selectedIndex = defaultIdx >= 0 ? defaultIdx : 0;

		const wrapper = containerEl.createDiv({ cls: 'es-rename-picker-table-wrapper' });
		const table = wrapper.createEl('table', { cls: 'es-rename-picker-table' });

		const thead = table.createEl('thead');
		const headerRow = thead.createEl('tr');
		headerRow.createEl('th', { cls: 'es-rename-picker-th-indicator' });
		headerRow.createEl('th', { text: '模式' });
		headerRow.createEl('th', { text: '类型' });
		headerRow.createEl('th', { text: '预览', cls: 'es-rename-picker-th-preview' });

		const tbody = table.createEl('tbody');
		this.rowEls = [];
		this.customInputs.clear();

		ALL_PATTERNS.forEach((def, idx) => {
			const row = tbody.createEl('tr', { cls: 'es-rename-picker-row' });
			this.rowEls.push(row);

			// Indicator column (▶ on selected row)
			row.createEl('td', { cls: 'es-rename-picker-indicator', text: '▶' });

			// Pattern name column
			row.createEl('td', {
				cls: 'es-rename-picker-name',
				text: this.i18n.patterns[def.id] ?? def.id,
			});

			// Type badge column
			const typeTd = row.createEl('td', { cls: 'es-rename-picker-type-td' });
			typeTd.createEl('span', {
				cls: `es-rename-type-badge es-rename-type-${def.type}`,
				text: this.getTypeLabel(def.type),
			});

			// Preview column
			const previewTd = row.createEl('td', { cls: 'es-rename-picker-preview-td' });
			if (def.needsCustom) {
				this.buildCustomPreview(previewTd, def, idx);
			} else {
				previewTd.createEl('span', {
					cls: 'es-rename-picker-preview-text',
					text: this.buildPreview(def.id, ''),
				});
			}

			// Row click to select
			row.addEventListener('click', (e) => {
				// Don't switch selection when clicking inside custom input
				if ((e.target as HTMLElement).tagName === 'INPUT') return;
				this.setSelected(idx);
				this.onChange?.();
			});

			if (idx === this.selectedIndex) row.addClass('is-selected');
		});
	}

	selectNext(): void {
		this.setSelected((this.selectedIndex + 1) % ALL_PATTERNS.length);
		this.scrollIntoView();
		this.onChange?.();
	}

	selectPrev(): void {
		this.setSelected((this.selectedIndex - 1 + ALL_PATTERNS.length) % ALL_PATTERNS.length);
		this.scrollIntoView();
		this.onChange?.();
	}

	getPattern(): RenamePattern {
		return ALL_PATTERNS[this.selectedIndex]?.id ?? 'date-prefix';
	}

	getCustomText(): string {
		return this.customInputs.get(this.selectedIndex)?.value ?? '';
	}

	setOnChange(cb: () => void): void {
		this.onChange = cb;
	}

	// ----------------------------------------------------------------
	// Private helpers
	// ----------------------------------------------------------------

	private setSelected(idx: number): void {
		const prev = this.rowEls[this.selectedIndex];
		if (prev) prev.removeClass('is-selected');
		this.selectedIndex = idx;
		const next = this.rowEls[idx];
		if (next) next.addClass('is-selected');
	}

	private scrollIntoView(): void {
		this.rowEls[this.selectedIndex]?.scrollIntoView({ block: 'nearest' });
	}

	private getTypeLabel(type: PatternDef['type']): string {
		switch (type) {
			case 'prefix':  return this.i18n.typePrefix;
			case 'suffix':  return this.i18n.typeSuffix;
			case 'replace': return this.i18n.typeReplace;
		}
	}

	/**
	 * Build the complete preview filename for a non-custom pattern.
	 */
	buildPreview(pattern: RenamePattern, customText: string): string {
		return applyPattern(this.basename, this.extension, pattern, {
			date:      this.previewDate,
			timestamp: this.previewTimestamp,
			uuid:      this.previewUuid,
			customText,
		});
	}

	/**
	 * Build inline custom-text preview cell.
	 * Layout: [before-static][INPUT][after-static]
	 */
	private buildCustomPreview(
		container: HTMLElement,
		def: PatternDef,
		rowIdx: number,
	): void {
		const { before, after } = this.getCustomParts(def.id);

		if (before) {
			container.createEl('span', {
				cls: 'es-rename-picker-custom-static',
				text: before,
			});
		}

		const input = container.createEl('input', {
			type: 'text',
			cls: 'es-rename-picker-custom-input',
			attr: { placeholder: this.i18n.customPlaceholder },
		});
		this.customInputs.set(rowIdx, input);

		if (after) {
			container.createEl('span', {
				cls: 'es-rename-picker-custom-static',
				text: after,
			});
		}

		input.addEventListener('input', () => {
			// Auto-select this row when user starts typing
			if (this.selectedIndex !== rowIdx) {
				this.setSelected(rowIdx);
			}
			this.onChange?.();
		});
	}

	/**
	 * Returns the static before/after fragments for a custom pattern preview.
	 *
	 * custom-prefix:  [INPUT]——basename.ext   → before='', after='——basename.ext'
	 * custom-suffix:  basename——[INPUT].ext   → before='basename——', after='.ext'
	 * custom-replace: [INPUT].ext             → before='', after='.ext'
	 */
	private getCustomParts(pattern: RenamePattern): { before: string; after: string } {
		const sep = '——';
		const normalExt = this.extension ? (this.extension.startsWith('.') ? this.extension : `.${this.extension}`) : '';
		const displayName = this.basename;

		switch (pattern) {
			case 'custom-prefix':  return { before: '',                       after: `${sep}${displayName}${normalExt}` };
			case 'custom-suffix':  return { before: `${displayName}${sep}`,   after: normalExt };
			case 'custom-replace': return { before: '',                       after: normalExt };
			default:               return { before: '',                       after: '' };
		}
	}
}
