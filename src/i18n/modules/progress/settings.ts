import type { I18nDict } from '../../locale';

interface ProgressSettingsI18n {
	barHeight: { name: string; desc: string };
	barColor: { name: string; desc: string };
}

export const progressSettingsI18n: I18nDict<ProgressSettingsI18n> = {
	zh: {
		barHeight: {
			name: '进度条高度（px）',
			desc: '进度条的像素高度，默认 3。',
		},
		barColor: {
			name: '进度条颜色',
			desc: '支持任意 CSS 颜色值，默认 var(--color-accent)。',
		},
	},
	en: {
		barHeight: {
			name: 'Bar height (px)',
			desc: 'Height of the progress bar in pixels. Default: 3.',
		},
		barColor: {
			name: 'Bar color',
			desc: 'Any CSS color value. Default: var(--color-accent).',
		},
	},
};
