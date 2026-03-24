import type { I18nDict } from '../../locale';

interface YamlSettingsI18n {
	validateOnChange: { name: string; desc: string };
	showLineNumbers: { name: string; desc: string };
	jsonViewer: { name: string; desc: string };
}

export const yamlSettingsI18n: I18nDict<YamlSettingsI18n> = {
	zh: {
		validateOnChange: {
			name: '实时验证',
			desc: '编辑时若 YAML frontmatter 存在语法错误，则显示警告提示。',
		},
		showLineNumbers: {
			name: '显示行号',
			desc: '在 YAML frontmatter 区域显示行号（需重启应用生效）。',
		},
		jsonViewer: {
			name: 'JSON 属性查看器',
			desc: '在阅读模式下，单击对象类型的属性值可打开 JSON 树形查看器；右键可复制。',
		},
	},
	en: {
		validateOnChange: {
			name: 'Real-time validation',
			desc: 'Show a warning notice when YAML frontmatter has syntax errors while editing.',
		},
		showLineNumbers: {
			name: 'Show line numbers',
			desc: 'Display line numbers in the YAML frontmatter block (requires app reload).',
		},
		jsonViewer: {
			name: 'JSON property viewer',
			desc: 'In reading mode, click an object-type property value to open a JSON tree viewer; right-click to copy.',
		},
	},
};
