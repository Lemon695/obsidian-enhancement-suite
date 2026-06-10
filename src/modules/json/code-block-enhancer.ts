import { Notice } from 'obsidian';
import type EnhancementSuitePlugin from '../../main';
import { parseJson } from './parser';
import { JsonViewerModal } from '../yaml/json-viewer-modal';
import { t } from '../../i18n/locale';
import { jsonViewerUiI18n } from '../../i18n/modules/json/viewer';

/**
 * Markdown JSON 代码块增强器。
 *
 * 在阅读模式下，对 ```json ... ``` 代码块注入「查看 JSON」按钮。
 * 点击按钮时解析代码块内容并打开 JsonViewerModal。
 *
 * 通过 plugin.registerMarkdownPostProcessor() 注册，插件卸载时自动清理。
 */
export class CodeBlockEnhancer {
	constructor(private readonly plugin: EnhancementSuitePlugin) {}

	/** 注册 Markdown post-processor。 */
	register(): void {
		this.plugin.registerMarkdownPostProcessor((el) => {
			if (!this.plugin.settings.json.enableCodeBlockEnhancer) return;

			const codeEls = el.querySelectorAll<HTMLElement>(
				'pre > code.language-json',
			);
			for (const codeEl of Array.from(codeEls)) {
				this.enhanceBlock(codeEl);
			}
		});
	}

	private enhanceBlock(codeEl: HTMLElement): void {
		const pre = codeEl.parentElement;
		if (!pre) return;

		// 避免重复注入
		if (pre.getAttribute('data-es-json-enhanced') === 'true') return;
		pre.setAttribute('data-es-json-enhanced', 'true');

		const i18n = t(jsonViewerUiI18n);

		const btn = activeDocument.createElement('button');
		btn.textContent = i18n.openInViewer;
		btn.className = 'es-json-code-block-btn';
		btn.setAttribute('aria-label', i18n.openInViewer);

		btn.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();

			const content = codeEl.textContent ?? '';
			const result = parseJson(content.trim());

			if (!result.ok) {
				new Notice(`${i18n.invalidJson}: ${result.error}`);
				return;
			}

			new JsonViewerModal(this.plugin.app, 'JSON', result.value).open();
		});

		pre.appendChild(btn);
	}
}
