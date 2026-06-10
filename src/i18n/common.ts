import type { I18nDict } from './locale';

interface CommonConfirmI18n {
	confirm: string;
	cancel: string;
	confirmTitle: string;
}

/** 通用确认对话框的按钮与标题文案（被 core/confirm-modal.ts 的调用方复用）。 */
export const commonConfirmI18n: I18nDict<CommonConfirmI18n> = {
	zh: {
		confirm: '确认',
		cancel: '取消',
		confirmTitle: '请确认',
	},
	en: {
		confirm: 'Confirm',
		cancel: 'Cancel',
		confirmTitle: 'Please confirm',
	},
};
