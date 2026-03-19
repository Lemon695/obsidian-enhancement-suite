import type { I18nDict } from '../locale';

interface SettingsTabI18n {
	heading: string;
	intro: string;
}

export const settingsTabI18n: I18nDict<SettingsTabI18n> = {
	zh: {
		heading: 'Enhancement Suite',
		intro: '开启或关闭各功能模块。启用模块后，其专属设置会显示在开关下方。',
	},
	en: {
		heading: 'Enhancement Suite',
		intro: 'Toggle modules on or off. Module-specific settings appear below each toggle when the module is enabled.',
	},
};
