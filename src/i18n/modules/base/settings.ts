import type { I18nDict } from '../../locale';

interface BaseSettingsI18n {
	formatOnSave: { name: string; desc: string };
}

export const baseSettingsI18n: I18nDict<BaseSettingsI18n> = {
	zh: {
		formatOnSave: {
			name: '源码模式保存时自动格式化',
			desc: '在源码编辑模式下，保存时自动将 .base 文件格式化为标准 YAML 格式。',
		},
	},
	en: {
		formatOnSave: {
			name: 'Auto-format on save (source mode)',
			desc: 'When editing in source mode, automatically format the .base file as standard YAML on save.',
		},
	},
};
