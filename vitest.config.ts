import { defineConfig } from 'vitest/config';

/**
 * Vitest 配置。
 *
 * 只测试无 Obsidian 依赖的纯函数（searcher.ts / frontmatter.ts / formatter.ts）。
 * Obsidian API 依赖的代码（Modal、Plugin 等）不在单元测试范围内。
 */
export default defineConfig({
	test: {
		// Node 环境即可，无需 DOM
		environment: 'node',
		// 只包含 src 目录下的测试文件
		include: ['src/**/*.test.ts'],
	},
});
