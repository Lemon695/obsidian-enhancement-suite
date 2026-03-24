import type { I18nDict } from '../../locale';

interface StatsSettingsI18n {
	chineseSpeed: { name: string; desc: string };
	englishSpeed: { name: string; desc: string };
}

export const statsSettingsI18n: I18nDict<StatsSettingsI18n> = {
	zh: {
		chineseSpeed: {
			name: '中文阅读速度（字/分钟）',
			desc: '统计中文字符时使用的阅读速度，默认 300。',
		},
		englishSpeed: {
			name: '英文阅读速度（词/分钟）',
			desc: '统计英文单词时使用的阅读速度，默认 200。',
		},
	},
	en: {
		chineseSpeed: {
			name: 'Chinese reading speed (chars/min)',
			desc: 'Reading speed used for CJK characters. Default: 300.',
		},
		englishSpeed: {
			name: 'English reading speed (words/min)',
			desc: 'Reading speed used for Latin words. Default: 200.',
		},
	},
};
