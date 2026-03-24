import type { I18nDict } from '../../locale';

interface JsonSettingsI18n {
	enableCodeBlockEnhancer: { name: string; desc: string };
	formatOnSave: { name: string; desc: string };
}

export const jsonSettingsI18n: I18nDict<JsonSettingsI18n> = {
	zh: {
		enableCodeBlockEnhancer: {
			name: 'JSON 代码块增强',
			desc: '在阅读模式下，Markdown 中的 JSON 代码块右上角显示"查看"按钮，点击可打开格式化查看器。',
		},
		formatOnSave: {
			name: '源码模式保存时自动格式化',
			desc: '在源码编辑模式下，保存时自动将 JSON 格式化为 2 格缩进的标准格式。',
		},
	},
	en: {
		enableCodeBlockEnhancer: {
			name: 'JSON code block enhancement',
			desc: 'In reading mode, show a "View" button on JSON code blocks in Markdown notes to open a formatted tree viewer.',
		},
		formatOnSave: {
			name: 'Auto-format on save (source mode)',
			desc: 'When editing in source mode, automatically format JSON with 2-space indentation on save.',
		},
	},
};
