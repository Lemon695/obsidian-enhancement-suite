import type { I18nDict } from '../../locale';

interface BatchPropertyI18n {
	title: string;
	keyLabel: string;
	keyPlaceholder: string;
	valueLabel: string;
	valuePlaceholder: string;
	operationLabel: string;
	opSet: string;
	opAppend: string;
	opDelete: string;
	scopeLabel: string;
	scopeFolder: string;
	scopeVault: string;
	previewLabel: (n: number) => string;
	applyBtn: string;
	cancelBtn: string;
	confirmMsg: (n: number, op: string, key: string) => string;
	doneNotice: (n: number) => string;
	noFilesNotice: string;
	noKeyNotice: string;
}

export const batchPropertyI18n: I18nDict<BatchPropertyI18n> = {
	zh: {
		title: '批量编辑属性',
		keyLabel: '属性名（Key）',
		keyPlaceholder: '例如：status',
		valueLabel: '属性值',
		valuePlaceholder: '例如：done',
		operationLabel: '操作',
		opSet: '设置（set）',
		opAppend: '追加（append）',
		opDelete: '删除（delete）',
		scopeLabel: '范围',
		scopeFolder: '当前文件夹',
		scopeVault: '整个 Vault',
		previewLabel: (n) => `将修改 ${n} 个文件`,
		applyBtn: '应用',
		cancelBtn: '取消',
		confirmMsg: (n, op, key) =>
			`确认对 ${n} 个文件执行「${op}」操作，属性名：${key}？此操作不可撤销。`,
		doneNotice: (n) => `已修改 ${n} 个文件的属性`,
		noFilesNotice: '当前范围内没有 Markdown 文件。',
		noKeyNotice: '请输入属性名。',
	},
	en: {
		title: 'Batch Edit Properties',
		keyLabel: 'Property key',
		keyPlaceholder: 'e.g. status',
		valueLabel: 'Value',
		valuePlaceholder: 'e.g. done',
		operationLabel: 'Operation',
		opSet: 'Set',
		opAppend: 'Append',
		opDelete: 'Delete',
		scopeLabel: 'Scope',
		scopeFolder: 'Current folder',
		scopeVault: 'Entire vault',
		previewLabel: (n) => `Will modify ${n} file${n === 1 ? '' : 's'}`,
		applyBtn: 'Apply',
		cancelBtn: 'Cancel',
		confirmMsg: (n, op, key) =>
			`Apply [${op}] on ${n} file${n === 1 ? '' : 's'}, key: "${key}"? This cannot be undone.`,
		doneNotice: (n) => `Modified ${n} file${n === 1 ? '' : 's'}`,
		noFilesNotice: 'No Markdown files found in scope.',
		noKeyNotice: 'Please enter a property key.',
	},
};
