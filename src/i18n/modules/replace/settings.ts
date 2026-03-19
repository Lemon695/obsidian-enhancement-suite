import type { I18nDict } from '../../locale';

interface ReplaceSettingsI18n {
	caseSensitive: { name: string; desc: string };
	useRegex: { name: string; desc: string };
}

export const replaceSettingsI18n: I18nDict<ReplaceSettingsI18n> = {
	zh: {
		caseSensitive: {
			name: '区分大小写',
			desc: '启用后，搜索时会区分大小写字母。',
		},
		useRegex: {
			name: '使用正则表达式',
			desc: '将搜索词解析为 ECMAScript 正则表达式。',
		},
	},
	en: {
		caseSensitive: {
			name: 'Case sensitive matching',
			desc: 'When enabled, searches distinguish between uppercase and lowercase letters.',
		},
		useRegex: {
			name: 'Use regular expressions',
			desc: 'Interpret search terms as ECMAScript regular expressions.',
		},
	},
};
