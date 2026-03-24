import type { I18nDict } from '../../locale';

interface ExportCommandsI18n {
	exportNote: { name: string };
}

export const exportCommandsI18n: I18nDict<ExportCommandsI18n> = {
	zh: {
		exportNote: { name: '导出：导出当前笔记' },
	},
	en: {
		exportNote: { name: 'Export: Export current note' },
	},
};
