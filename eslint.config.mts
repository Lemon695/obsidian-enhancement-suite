import tseslint from 'typescript-eslint';
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: [
						'eslint.config.js',
						'manifest.json'
					]
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json']
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		// terminal / vault 是「通用插件中的桌面专属功能」：
		// 运行时已用 Platform.isMobileApp 守卫（移动端隐藏命令、不执行 require），
		// 故有意保持 manifest.isDesktopOnly = false 以保留其余模块的移动端支持。
		// 这两个目录允许使用 Node 内置模块；提供 node 全局以消除 no-undef。
		files: ['src/modules/terminal/**/*.ts', 'src/modules/vault/**/*.ts'],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
		rules: {
			'import/no-nodejs-modules': 'off',
		},
	},
	globalIgnores([
		"node_modules",
		"dist",
		"esbuild.config.mjs",
		"eslint.config.js",
		"vitest.config.ts",
		"version-bump.mjs",
		"versions.json",
		"main.js",
	]),
);
