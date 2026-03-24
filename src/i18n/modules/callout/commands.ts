import type { I18nDict } from '../../locale';

interface CalloutCommandsI18n {
	insertCallout: { name: string };
	modalPlaceholder: string;
	defaultTitle: string;
	defaultContent: string;
}

export const calloutCommandsI18n: I18nDict<CalloutCommandsI18n> = {
	zh: {
		insertCallout: { name: 'Callout：插入 Callout 块' },
		modalPlaceholder: '选择 Callout 类型...',
		defaultTitle: '标题',
		defaultContent: '内容',
	},
	en: {
		insertCallout: { name: 'Callout: Insert callout block' },
		modalPlaceholder: 'Select callout type...',
		defaultTitle: 'Title',
		defaultContent: 'Content',
	},
};
