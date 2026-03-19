import { getLanguage } from 'obsidian';

/**
 * Bilingual dictionary type. Each key maps to its Chinese and English value.
 *
 * Values may be strings or functions (for templates / pluralisation).
 */
export type I18nDict<T> = { zh: T; en: T };

/**
 * Returns the locale-appropriate variant from a bilingual dictionary.
 *
 * Language detection uses Obsidian's official getLanguage() API (v1.8.7+),
 * which directly reflects the language set in Obsidian → Settings → General:
 *   - Any locale that starts with "zh" → Chinese
 *   - Everything else → English
 */
export function t<T>(dict: I18nDict<T>): T {
	return getLanguage().startsWith('zh') ? dict.zh : dict.en;
}
