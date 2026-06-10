import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest 配置。
 *
 * 只测试无 Obsidian 依赖的纯函数（searcher.ts / frontmatter.ts / formatter.ts）。
 * Obsidian API 依赖的代码（Modal、Plugin 等）不在单元测试范围内。
 *
 * obsidian 包由 esbuild 在构建时外部化，vitest 无法解析，
 * 故通过 resolve.alias 将其指向最小化 mock（src/__mocks__/obsidian.ts）。
 *
 * tsconfig 使用 baseUrl: "src"，vitest 需要对应的 alias 才能解析
 * i18n/*、core/*、modules/*、main 等路径。
 */
export default defineConfig({
	resolve: {
		alias: {
			obsidian: path.resolve(__dirname, 'src/__mocks__/obsidian.ts'),
			// tsconfig baseUrl: "src" — mirror the same resolution here
			i18n:    path.resolve(__dirname, 'src/i18n'),
			core:    path.resolve(__dirname, 'src/core'),
			modules: path.resolve(__dirname, 'src/modules'),
			main:    path.resolve(__dirname, 'src/main.ts'),
		},
	},
	test: {
		// Node 环境即可，无需 DOM
		environment: 'node',
		// 只包含 src 目录下的测试文件
		include: ['src/**/*.test.ts'],
	},
});
