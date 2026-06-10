import type { I18nDict } from '../../locale';

interface TerminalSettingsI18n {
	terminalPickerName: string;
	terminalPickerDesc: string;
	autoOption: (label: string) => string;
	desktopOnlyNotice: string;
}

export const terminalSettingsI18n: I18nDict<TerminalSettingsI18n> = {
	zh: {
		terminalPickerName: '终端应用',
		terminalPickerDesc: '选择命令使用的终端。「自动」将使用已检测到的第一个终端。',
		autoOption: (label) => `自动（已检测：${label}）`,
		desktopOnlyNotice: '此功能仅在桌面端可用，命令不会出现在移动设备的命令面板中。',
	},
	en: {
		terminalPickerName: 'Terminal application',
		terminalPickerDesc: 'Choose which terminal to use. "Auto" uses the first detected terminal.',
		autoOption: (label) => `Auto (detected: ${label})`,
		desktopOnlyNotice: 'This feature is desktop only. Commands will not appear on mobile devices.',
	},
};
