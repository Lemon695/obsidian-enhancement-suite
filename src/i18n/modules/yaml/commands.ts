import type { I18nDict } from '../../locale';

interface YamlCommandsI18n {
	showSummary: { name: string };
	validate: { name: string };
	batchEditProperty: { name: string };

	/** Notice: no frontmatter detected (validate command). */
	noFrontmatter: string;
	/** Notice: frontmatter block not closed (validate command). */
	notClosed: string;
	/** Notice: frontmatter is valid (validate command). */
	valid: string;
	/** Prefix for YAML error notices. A newline and error message follow. */
	errorPrefix: string;

	/** Notice: no frontmatter found for the given file (summary command). */
	summaryNoFrontmatter: (basename: string) => string;
	/** First line of the summary notice. */
	summaryTitle: (basename: string) => string;
	/** Fields line: "Fields (N): key1, key2" */
	summaryFields: (count: number, keys: string) => string;
	/** Errors header line: "Errors (N):" */
	summaryErrors: (count: number) => string;
	/** Shown when there are no validation errors. */
	summaryNoErrors: string;
}

export const yamlCommandsI18n: I18nDict<YamlCommandsI18n> = {
	zh: {
		showSummary: { name: 'YAML：显示 frontmatter 摘要' },
		validate: { name: 'YAML：验证 frontmatter' },
		batchEditProperty: { name: 'YAML：批量编辑属性' },

		noFrontmatter: '当前笔记中没有 frontmatter。',
		notClosed: 'Frontmatter 块未正确关闭。',
		valid: 'Frontmatter 格式正确。',
		errorPrefix: 'YAML frontmatter 错误：\n',

		summaryNoFrontmatter: (b) => `${b}：未找到 frontmatter。`,
		summaryTitle: (b) => `${b} — frontmatter`,
		summaryFields: (n, keys) => `字段（${n}）：${keys || '（无）'}`,
		summaryErrors: (n) => `错误（${n}）：`,
		summaryNoErrors: '无验证错误。',
	},
	en: {
		showSummary: { name: 'YAML: Show frontmatter summary' },
		validate: { name: 'YAML: Validate frontmatter' },
		batchEditProperty: { name: 'YAML: Batch edit properties' },

		noFrontmatter: 'No frontmatter found in this note.',
		notClosed: 'Frontmatter block is not properly closed.',
		valid: 'Frontmatter is valid.',
		errorPrefix: 'YAML frontmatter error:\n',

		summaryNoFrontmatter: (b) => `${b}: No frontmatter found.`,
		summaryTitle: (b) => `${b} — frontmatter`,
		summaryFields: (n, keys) => `Fields (${n}): ${keys || '(none)'}`,
		summaryErrors: (n) => `Errors (${n}):`,
		summaryNoErrors: 'No validation errors.',
	},
};
