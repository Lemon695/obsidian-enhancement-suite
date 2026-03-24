import type { I18nDict } from '../../locale';

interface YamlModuleI18n {
	name: string;
	description: string;
}

export const yamlModuleI18n: I18nDict<YamlModuleI18n> = {
	zh: {
		name: 'YAML 增强',
		description: '实时 YAML frontmatter 验证、结构检查和 JSON 属性查看器。',
	},
	en: {
		name: 'YAML Enhancement',
		description:
			'Real-time YAML frontmatter validation, structure inspection, and JSON property viewer.',
	},
};
