/**
 * 批量导出文件过滤纯函数。
 *
 * 职责：根据导出范围和条件，从文件列表中筛选出目标文件。
 * 不依赖 Obsidian API，可单元测试。
 */

export type ExportScope = 'vault' | 'folder' | 'tag';

export interface FileRecord {
	/** Vault 内的相对路径，例如 "notes/a.md"。 */
	path: string;
	/** 文件的标签列表，每个标签带 # 前缀，例如 ["#project", "#active"]。 */
	tags: string[];
}

/**
 * 根据导出范围过滤文件列表。
 *
 * @param files             所有可导出的文件记录
 * @param scope             过滤范围：'vault'（全库）/ 'folder'（当前文件夹）/ 'tag'（指定标签）
 * @param currentFolderPath 当前活跃文件的所在文件夹路径（scope=folder 时使用）
 *                          - null 或空字符串 '' 均表示 vault 根目录
 *                          - null 在 folder scope 下回退到 vault 范围
 * @param targetTag         要筛选的标签（scope=tag 时使用）；可带或不带 # 前缀
 * @returns 符合条件的文件记录子集（不修改原数组）
 */
export function filterFilesByScope(
	files: FileRecord[],
	scope: ExportScope,
	currentFolderPath: string | null,
	targetTag: string
): FileRecord[] {
	switch (scope) {
		case 'vault':
			return files;

		case 'folder': {
			// null 回退到全库
			if (currentFolderPath === null) return files;

			if (currentFolderPath === '') {
				// 根目录：路径中不含 '/'（直接子文件）
				return files.filter((f) => !f.path.includes('/'));
			}

			// 仅保留直接子文件（不递归）：前缀匹配 + 剩余部分不含 '/'
			const prefix = currentFolderPath + '/';
			return files.filter((f) => {
				if (!f.path.startsWith(prefix)) return false;
				const remainder = f.path.slice(prefix.length);
				return remainder.length > 0 && !remainder.includes('/');
			});
		}

		case 'tag': {
			if (!targetTag) return [];
			// 标准化：确保标签带 # 前缀
			const normalized = targetTag.startsWith('#') ? targetTag : `#${targetTag}`;
			return files.filter((f) => f.tags.includes(normalized));
		}
	}
}
