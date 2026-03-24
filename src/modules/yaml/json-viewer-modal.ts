import { App, Modal, Notice } from 'obsidian';
import { t } from '../../i18n/locale';
import { jsonViewerI18n } from '../../i18n/modules/yaml/json-viewer';

/**
 * 长字符串截断阈值（字符数）。
 * 超过此长度的字符串默认显示为单行截断，点击可展开完整内容。
 */
const LONG_STRING_THRESHOLD = 80;

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

/**
 * JSON 属性查看器弹窗。
 *
 * 以树形结构展示 JSON 对象或数组：
 *   - 对象/数组节点带 +/- 按钮，默认全部展开
 *   - 超长字符串默认截断，点击切换展开/折叠
 *   - 底部提供「复制 JSON」按钮（美化格式）
 */
export class JsonViewerModal extends Modal {
	constructor(
		app: App,
		private readonly fieldKey: string,
		private readonly value: unknown,
	) {
		super(app);
	}

	onOpen(): void {
		const i18n = t(jsonViewerI18n);

		this.modalEl.addClass('es-json-viewer-modal');
		this.titleEl.setText(this.fieldKey);

		const treeEl = this.contentEl.createDiv({ cls: 'es-json-tree' });
		renderNode(treeEl, this.value);

		const footer = this.contentEl.createDiv({ cls: 'es-json-modal-footer' });
		const copyBtn = footer.createEl('button', {
			text: i18n.copyBtn,
			cls: 'mod-cta',
		});
		copyBtn.addEventListener('click', () => {
			const text = JSON.stringify(this.value, null, 2);
			navigator.clipboard.writeText(text).then(
				() => {
					copyBtn.setText(i18n.copied);
					window.setTimeout(() => copyBtn.setText(i18n.copyBtn), 1500);
				},
				() => new Notice(i18n.copyFailed),
			);
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

// ---------------------------------------------------------------------------
// 公共入口：供外部模块调用
// ---------------------------------------------------------------------------

/**
 * 将任意 JSON 值渲染为树形 DOM 结构，挂载到 container。
 * 供需要内嵌树形视图的外部组件（如 JSON 文件视图）调用。
 */
export function renderJsonTree(container: HTMLElement, value: unknown): void {
	renderNode(container, value);
}

// ---------------------------------------------------------------------------
// 渲染树形节点（纯函数，递归）
// ---------------------------------------------------------------------------

/**
 * 将任意 JSON 值渲染为树形 DOM 结构。
 *
 * @param container  目标容器元素
 * @param value      要渲染的值
 * @param key        父对象中的键名；顶层或数组元素时为 undefined
 * @param isLast     是否为父容器中的最后一项（决定是否渲染结尾逗号）
 */
function renderNode(
	container: HTMLElement,
	value: unknown,
	key?: string,
	isLast = true,
): void {
	if (value === null || value === undefined) {
		renderPrimitive(container, 'null', 'es-json-null', key, isLast);
	} else if (Array.isArray(value)) {
		const arr = value;
		renderCollapsible(container, '[', ']', key, isLast, (body) => {
			arr.forEach((item, i) =>
				renderNode(body, item, undefined, i === arr.length - 1),
			);
		});
	} else if (typeof value === 'object') {
		const entries = Object.entries(value as Record<string, unknown>);
		renderCollapsible(container, '{', '}', key, isLast, (body) => {
			entries.forEach(([k, v], i) =>
				renderNode(body, v, k, i === entries.length - 1),
			);
		});
	} else if (typeof value === 'string') {
		renderString(container, value, key, isLast);
	} else {
		const cls =
			typeof value === 'number'
				? 'es-json-number'
				: typeof value === 'boolean'
					? 'es-json-boolean'
					: 'es-json-unknown';
		renderPrimitive(container, String(value), cls, key, isLast);
	}
}

/**
 * 渲染可折叠块（对象 `{…}` 或数组 `[…]`）。
 *
 * 结构：
 *   headerRow:  [toggle] ["key": ] [openBrace] [collapsed hint（隐藏）]
 *   body:       (缩进的子节点)
 *   footerRow:  [closeBrace] [,?]
 */
function renderCollapsible(
	container: HTMLElement,
	openBrace: string,
	closeBrace: string,
	key: string | undefined,
	isLast: boolean,
	renderBody: (body: HTMLElement) => void,
): void {
	const i18n = t(jsonViewerI18n);
	const wrapper = container.createDiv({ cls: 'es-json-collapsible' });

	// Header: toggle + 可选 key + 开括号
	const headerRow = wrapper.createDiv({ cls: 'es-json-header-row' });

	const toggle = headerRow.createSpan({ cls: 'es-json-toggle', text: '-' });
	toggle.setAttribute('role', 'button');
	toggle.setAttribute('tabindex', '0');
	toggle.setAttribute('aria-label', i18n.collapse);

	if (key !== undefined) {
		headerRow.createSpan({ cls: 'es-json-key', text: `"${key}"` });
		headerRow.createSpan({ cls: 'es-json-colon', text: ': ' });
	}
	headerRow.createSpan({ cls: 'es-json-brace', text: openBrace });

	// 折叠时的占位提示（展开时隐藏）
	const hint = headerRow.createSpan({
		cls: 'es-json-collapsed-hint',
		text: isLast ? ` ... ${closeBrace}` : ` ... ${closeBrace},`,
	});
	hint.style.display = 'none';

	// Body（缩进子项）
	const body = wrapper.createDiv({ cls: 'es-json-body' });
	renderBody(body);

	// Footer：闭括号 + 可选逗号
	const footerRow = wrapper.createDiv({ cls: 'es-json-footer-row' });
	footerRow.createSpan({ cls: 'es-json-brace', text: closeBrace });
	if (!isLast) footerRow.createSpan({ cls: 'es-json-comma', text: ',' });

	// 展开 / 折叠交互
	let expanded = true;

	const doToggle = () => {
		expanded = !expanded;
		toggle.setText(expanded ? '-' : '+');
		toggle.setAttribute('aria-label', expanded ? i18n.collapse : i18n.expand);
		body.style.display = expanded ? '' : 'none';
		footerRow.style.display = expanded ? '' : 'none';
		hint.style.display = expanded ? 'none' : '';
	};

	toggle.addEventListener('click', (e) => {
		e.stopPropagation();
		doToggle();
	});
	toggle.addEventListener('keydown', (e: KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			doToggle();
		}
	});
}

/**
 * 渲染基本类型（null / number / boolean）。
 */
function renderPrimitive(
	container: HTMLElement,
	text: string,
	cls: string,
	key: string | undefined,
	isLast: boolean,
): void {
	const row = container.createDiv({ cls: 'es-json-row' });
	if (key !== undefined) {
		row.createSpan({ cls: 'es-json-key', text: `"${key}"` });
		row.createSpan({ cls: 'es-json-colon', text: ': ' });
	}
	row.createSpan({ cls, text });
	if (!isLast) row.createSpan({ cls: 'es-json-comma', text: ',' });
}

/**
 * 渲染字符串值。
 * 超过 LONG_STRING_THRESHOLD 的字符串默认截断，点击可展开。
 */
function renderString(
	container: HTMLElement,
	value: string,
	key: string | undefined,
	isLast: boolean,
): void {
	const i18n = t(jsonViewerI18n);
	const row = container.createDiv({ cls: 'es-json-row' });

	if (key !== undefined) {
		row.createSpan({ cls: 'es-json-key', text: `"${key}"` });
		row.createSpan({ cls: 'es-json-colon', text: ': ' });
	}

	const full = `"${value}"`;
	const isLong = value.length > LONG_STRING_THRESHOLD;

	if (!isLong) {
		row.createSpan({ cls: 'es-json-string', text: full });
	} else {
		const truncated = `"${value.slice(0, LONG_STRING_THRESHOLD)}..."`;
		const span = row.createSpan({
			cls: 'es-json-string es-json-string-long',
			text: truncated,
		});
		span.setAttribute('title', i18n.clickToExpand);
		span.setAttribute('role', 'button');
		span.setAttribute('tabindex', '0');

		let stringExpanded = false;

		const doToggleString = () => {
			stringExpanded = !stringExpanded;
			span.setText(stringExpanded ? full : truncated);
			span.setAttribute(
				'title',
				stringExpanded ? i18n.clickToCollapse : i18n.clickToExpand,
			);
			span.classList.toggle('es-json-string-expanded', stringExpanded);
			row.classList.toggle('es-json-row-expanded', stringExpanded);
		};

		span.addEventListener('click', (e) => {
			e.stopPropagation();
			doToggleString();
		});
		span.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				doToggleString();
			}
		});
	}

	if (!isLast) row.createSpan({ cls: 'es-json-comma', text: ',' });
}
