import { App, Menu, Notice } from 'obsidian';
import { JsonViewerModal } from './json-viewer-modal';
import { t } from '../../i18n/locale';
import { jsonViewerI18n } from '../../i18n/modules/yaml/json-viewer';

/**
 * Properties 面板增强器。
 *
 * 在阅读模式（preview）的 Properties 面板中，对类型为 object / array 的属性值
 * 注入以下交互：
 *   - 右键菜单：「复制 JSON」（美化格式）
 *   - 左键单击：打开 JsonViewerModal 树形查看器
 *
 * 使用 data-es-enhanced="true" 标记已处理的元素，避免重复绑定。
 */
export class PropertyEnhancer {
	constructor(private readonly app: App) {}

	/**
	 * 扫描 `containerEl`（`.metadata-container`）内的所有属性行，
	 * 对值为对象或数组的属性注入右键菜单和点击处理器。
	 *
	 * @param containerEl  阅读模式 Properties 面板的根容器
	 * @param frontmatter  当前文件经 Obsidian 解析后的 frontmatter 对象
	 */
	enhance(
		containerEl: HTMLElement,
		frontmatter: Record<string, unknown>,
	): void {
		const propEls =
			containerEl.querySelectorAll<HTMLElement>('.metadata-property');

		for (const propEl of Array.from(propEls)) {
			const key = propEl.getAttribute('data-property-key');
			if (!key) continue;

			// 从解析好的 frontmatter 中获取值（比解析 DOM 文本更可靠）
			const rawValue: unknown = frontmatter[key];
			if (!isEnhanceable(rawValue)) continue;

			// 查找值容器元素
			const valueEl =
				propEl.querySelector<HTMLElement>('.metadata-property-value');
			if (!valueEl) continue;

			// 跳过已处理的元素
			if (valueEl.getAttribute('data-es-enhanced') === 'true') continue;
			valueEl.setAttribute('data-es-enhanced', 'true');

			this.attachHandlers(valueEl, key, rawValue);
		}
	}

	// ---------------------------------------------------------------------------
	// 私有方法
	// ---------------------------------------------------------------------------

	private attachHandlers(
		el: HTMLElement,
		key: string,
		value: unknown,
	): void {
		// 视觉提示：hover 时轻微高亮，cursor 变为 pointer
		el.classList.add('es-json-value-hint');

		// 右键菜单：复制 JSON
		el.addEventListener('contextmenu', (e: MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const i18n = t(jsonViewerI18n);
			const menu = new Menu();
			menu.addItem((item) =>
				item
					.setTitle(i18n.copyMenuTitle)
					.setIcon('copy')
					.onClick(() => {
						const text = JSON.stringify(value, null, 2);
						navigator.clipboard.writeText(text).catch(() =>
							new Notice(i18n.copyFailed),
						);
					}),
			);
			menu.showAtMouseEvent(e);
		});

		// 左键单击：打开 JSON 查看器弹窗
		el.addEventListener('click', (e: MouseEvent) => {
			e.stopPropagation();
			new JsonViewerModal(this.app, key, value).open();
		});
	}
}

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/**
 * 判断一个值是否值得增强（即为非 null 的对象或数组）。
 * 字符串 / 数字 / boolean 等基本类型不需要增强。
 */
function isEnhanceable(value: unknown): boolean {
	return value !== null && value !== undefined && typeof value === 'object';
}
