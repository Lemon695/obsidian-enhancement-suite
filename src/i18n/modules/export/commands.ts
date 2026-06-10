import type { I18nDict } from '../../locale';

interface ExportCommandsI18n {
	exportNote: { name: string };
	batchExport: { name: string };
}

export const exportCommandsI18n: I18nDict<ExportCommandsI18n> = {
	zh: {
		exportNote: { name: '导出：导出当前笔记' },
		batchExport: { name: '导出：批量导出笔记' },
	},
	en: {
		exportNote: { name: 'Export: Export current note' },
		batchExport: { name: 'Export: Batch export notes' },
	},
};
