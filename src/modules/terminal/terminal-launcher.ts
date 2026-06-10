import { Notice } from 'obsidian';
import { t } from 'i18n/locale';
import { terminalCommandsI18n } from 'i18n/modules/terminal/commands';
import type EnhancementSuitePlugin from 'main';

// ── Types ──────────────────────────────────────────────────────────────────────

export type TerminalId =
	// macOS
	| 'Terminal'
	| 'iTerm'
	| 'Ghostty'
	| 'Warp'
	| 'Alacritty'
	| 'WezTerm'
	| 'kitty'
	// Windows
	| 'wt'
	| 'powershell'
	| 'cmd'
	// Linux
	| 'gnome-terminal'
	| 'konsole'
	| 'xterm';

export interface DetectedTerminal {
	id: TerminalId;
	label: string;
}

// ── Path escaping helpers ──────────────────────────────────────────────────────

/**
 * Wrap in POSIX single-quotes; escape embedded single-quotes as '\''.
 * Safe for macOS / Linux shell commands.
 */
function quotePosix(p: string): string {
	return `'${p.replace(/'/g, "'\\''")}'`;
}

/**
 * Wrap in Windows double-quotes.
 * Double-quotes are illegal in NTFS filenames, so no escaping is needed.
 */
function quoteWindows(p: string): string {
	return `"${p}"`;
}

/**
 * Escape path for PowerShell's Set-Location.
 * Single-quote is escaped by doubling: ' → ''
 */
function quotePowerShell(p: string): string {
	return `'${p.replace(/'/g, "''")}'`;
}

/**
 * Escape path for use inside a double-quoted xterm -e argument.
 * Backslash and double-quote are escaped.
 */
function quoteXterm(p: string): string {
	const escaped = p.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
	return `\\"${escaped}\\"`;
}

// ── Pure command builder ───────────────────────────────────────────────────────

/**
 * Return the shell command that opens `dirPath` in the specified terminal.
 *
 * Pure function — no I/O, no side effects, fully unit-testable.
 */
export function buildCommand(dirPath: string, terminalId: TerminalId): string {
	const posix = quotePosix(dirPath);
	const win   = quoteWindows(dirPath);

	switch (terminalId) {
		// ── macOS ──────────────────────────────────────────────────────────────
		case 'Terminal':  return `open -a Terminal ${posix}`;
		case 'iTerm':     return `open -a iTerm ${posix}`;
		case 'Ghostty':   return `open -a Ghostty ${posix}`;
		case 'Warp':      return `open -a Warp ${posix}`;
		case 'Alacritty': return `open -a Alacritty --args --working-directory ${posix}`;
		case 'WezTerm':   return `open -a WezTerm ${posix}`;
		case 'kitty':     return `open -a kitty --args --directory ${posix}`;

		// ── Windows ────────────────────────────────────────────────────────────
		case 'wt':         return `wt -d ${win}`;
		case 'powershell': return `start powershell -noexit -command "Set-Location ${quotePowerShell(dirPath)}"`;
		case 'cmd':        return `start "" /D ${win} cmd`;

		// ── Linux ──────────────────────────────────────────────────────────────
		case 'gnome-terminal': return `gnome-terminal --working-directory=${posix}`;
		case 'konsole':        return `konsole --workdir ${posix}`;
		case 'xterm':          return `xterm -e "cd ${quoteXterm(dirPath)} && exec bash"`;
	}
}

// ── Terminal catalogue ─────────────────────────────────────────────────────────

interface MacTerminalCandidate {
	id: TerminalId;
	label: string;
	bundlePath: string;
}

/** Priority order: first match wins for 'auto' mode. */
const MAC_TERMINALS: MacTerminalCandidate[] = [
	{ id: 'Ghostty',   label: 'Ghostty',   bundlePath: '/Applications/Ghostty.app' },
	{ id: 'Warp',      label: 'Warp',      bundlePath: '/Applications/Warp.app' },
	{ id: 'iTerm',     label: 'iTerm2',    bundlePath: '/Applications/iTerm.app' },
	{ id: 'Alacritty', label: 'Alacritty', bundlePath: '/Applications/Alacritty.app' },
	{ id: 'WezTerm',   label: 'WezTerm',   bundlePath: '/Applications/WezTerm.app' },
	{ id: 'kitty',     label: 'kitty',     bundlePath: '/Applications/kitty.app' },
	{ id: 'Terminal',  label: 'Terminal',  bundlePath: '/System/Applications/Utilities/Terminal.app' },
];

const WIN_TERMINALS: DetectedTerminal[] = [
	{ id: 'wt',         label: 'Windows Terminal' },
	{ id: 'powershell', label: 'PowerShell' },
	{ id: 'cmd',        label: 'Command Prompt' },
];

const LINUX_TERMINALS: DetectedTerminal[] = [
	{ id: 'gnome-terminal', label: 'GNOME Terminal' },
	{ id: 'konsole',        label: 'Konsole' },
	{ id: 'xterm',          label: 'xterm' },
];

// ── TerminalLauncher ───────────────────────────────────────────────────────────

export class TerminalLauncher {
	/** Cached scan result; populated on first call to detect(). */
	private cache: DetectedTerminal[] | null = null;

	constructor(private readonly plugin: EnhancementSuitePlugin) {}

	/**
	 * Scan the current platform for installed terminals.
	 * Result is cached after the first call.
	 */
	detect(): DetectedTerminal[] {
		if (this.cache !== null) return this.cache;
		this.cache = this.scanPlatform();
		return this.cache;
	}

	/** Human-readable label of the auto-selected terminal, e.g. "Warp". */
	autoLabel(): string {
		return this.detect()[0]?.label ?? '—';
	}

	/** Open `dirPath` in the configured (or auto-detected) terminal. */
	launch(dirPath: string): void {
		const terminalId = this.resolveTerminalId();
		if (!terminalId) {
			new Notice(t(terminalCommandsI18n).errorNoTerminal);
			return;
		}

		const command = buildCommand(dirPath, terminalId);
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { exec } = require('child_process') as typeof import('child_process');
		exec(command, (err) => {
			if (err) {
				console.error('[TerminalLauncher] launch failed:', err);
				new Notice(t(terminalCommandsI18n).errorLaunchFailed);
			}
		});
	}

	// ── private ───────────────────────────────────────────────────────────────

	private resolveTerminalId(): TerminalId | null {
		const pref = this.plugin.settings.terminal.preferredTerminal;
		if (pref === 'auto') {
			return this.detect()[0]?.id ?? null;
		}
		return pref as TerminalId;
	}

	private scanPlatform(): DetectedTerminal[] {
		const platform = process.platform;
		if (platform === 'darwin') return this.scanMac();
		if (platform === 'win32')  return WIN_TERMINALS;
		return this.scanLinux();
	}

	private scanMac(): DetectedTerminal[] {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const fs = require('fs') as typeof import('fs');
		return MAC_TERMINALS
			.filter((c) => fs.existsSync(c.bundlePath))
			.map(({ id, label }) => ({ id, label }));
	}

	private scanLinux(): DetectedTerminal[] {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { execSync } = require('child_process') as typeof import('child_process');
		return LINUX_TERMINALS.filter(({ id }) => {
			try {
				execSync(`which ${id}`, { stdio: 'pipe' });
				return true;
			} catch {
				return false;
			}
		});
	}
}
