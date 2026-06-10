import { describe, it, expect } from 'vitest';
import { buildCommand } from './terminal-launcher';

// ──────────────────────────────────────────────────────────────────────────────
// buildCommand — pure function, no side effects, fully testable
// ──────────────────────────────────────────────────────────────────────────────

describe('buildCommand', () => {
	// ── macOS terminals ────────────────────────────────────────────────────────

	describe('Terminal.app', () => {
		it('basic path', () => {
			expect(buildCommand('/Users/su/Notes', 'Terminal')).toBe(
				"open -a Terminal '/Users/su/Notes'",
			);
		});

		it('path with spaces', () => {
			expect(buildCommand('/Users/su/My Notes', 'Terminal')).toBe(
				"open -a Terminal '/Users/su/My Notes'",
			);
		});

		it("path with single quote", () => {
			expect(buildCommand("/Users/su/Jeff's Notes", 'Terminal')).toBe(
				"open -a Terminal '/Users/su/Jeff'\\''s Notes'",
			);
		});

		it('path with Chinese characters', () => {
			expect(buildCommand('/Users/su/笔记', 'Terminal')).toBe(
				"open -a Terminal '/Users/su/笔记'",
			);
		});
	});

	describe('iTerm2', () => {
		it('basic path', () => {
			expect(buildCommand('/Users/su/Notes', 'iTerm')).toBe(
				"open -a iTerm '/Users/su/Notes'",
			);
		});

		it('path with spaces', () => {
			expect(buildCommand('/Users/su/My Notes', 'iTerm')).toBe(
				"open -a iTerm '/Users/su/My Notes'",
			);
		});
	});

	describe('Ghostty', () => {
		it('basic path', () => {
			expect(buildCommand('/Users/su/Notes', 'Ghostty')).toBe(
				"open -a Ghostty '/Users/su/Notes'",
			);
		});

		it('path with Chinese characters', () => {
			expect(buildCommand('/Users/su/笔记/项目', 'Ghostty')).toBe(
				"open -a Ghostty '/Users/su/笔记/项目'",
			);
		});
	});

	describe('Warp (option A: open -a)', () => {
		it('basic path', () => {
			expect(buildCommand('/Users/su/Notes', 'Warp')).toBe(
				"open -a Warp '/Users/su/Notes'",
			);
		});

		it('path with spaces', () => {
			expect(buildCommand('/Users/su/My Notes', 'Warp')).toBe(
				"open -a Warp '/Users/su/My Notes'",
			);
		});

		it("path with single quote", () => {
			expect(buildCommand("/Users/su/Jeff's Notes", 'Warp')).toBe(
				"open -a Warp '/Users/su/Jeff'\\''s Notes'",
			);
		});

		it('path with Chinese characters', () => {
			expect(buildCommand('/Users/su/笔记', 'Warp')).toBe(
				"open -a Warp '/Users/su/笔记'",
			);
		});
	});

	describe('Alacritty (macOS)', () => {
		it('basic path', () => {
			expect(buildCommand('/Users/su/Notes', 'Alacritty')).toBe(
				"open -a Alacritty --args --working-directory '/Users/su/Notes'",
			);
		});

		it('path with spaces', () => {
			expect(buildCommand('/Users/su/My Notes', 'Alacritty')).toBe(
				"open -a Alacritty --args --working-directory '/Users/su/My Notes'",
			);
		});
	});

	describe('WezTerm', () => {
		it('basic path', () => {
			expect(buildCommand('/Users/su/Notes', 'WezTerm')).toBe(
				"open -a WezTerm '/Users/su/Notes'",
			);
		});
	});

	describe('kitty (macOS)', () => {
		it('basic path', () => {
			expect(buildCommand('/Users/su/Notes', 'kitty')).toBe(
				"open -a kitty --args --directory '/Users/su/Notes'",
			);
		});

		it('path with spaces', () => {
			expect(buildCommand('/Users/su/My Notes', 'kitty')).toBe(
				"open -a kitty --args --directory '/Users/su/My Notes'",
			);
		});
	});

	// ── Windows terminals ──────────────────────────────────────────────────────

	describe('Windows Terminal (wt)', () => {
		it('basic path', () => {
			expect(buildCommand('C:\\Users\\su\\Notes', 'wt')).toBe(
				'wt -d "C:\\Users\\su\\Notes"',
			);
		});

		it('path with spaces', () => {
			expect(buildCommand('C:\\Users\\su\\My Notes', 'wt')).toBe(
				'wt -d "C:\\Users\\su\\My Notes"',
			);
		});
	});

	describe('PowerShell', () => {
		it('basic path', () => {
			expect(buildCommand('C:\\Users\\su\\Notes', 'powershell')).toBe(
				"start powershell -noexit -command \"Set-Location 'C:\\Users\\su\\Notes'\"",
			);
		});

		it("path with single quote", () => {
			expect(buildCommand("C:\\Users\\su\\Jeff's Notes", 'powershell')).toBe(
				"start powershell -noexit -command \"Set-Location 'C:\\Users\\su\\Jeff''s Notes'\"",
			);
		});
	});

	describe('cmd', () => {
		it('basic path', () => {
			expect(buildCommand('C:\\Users\\su\\Notes', 'cmd')).toBe(
				'start "" /D "C:\\Users\\su\\Notes" cmd',
			);
		});

		it('path with spaces', () => {
			expect(buildCommand('C:\\Users\\su\\My Notes', 'cmd')).toBe(
				'start "" /D "C:\\Users\\su\\My Notes" cmd',
			);
		});
	});

	// ── Linux terminals ────────────────────────────────────────────────────────

	describe('GNOME Terminal', () => {
		it('basic path', () => {
			expect(buildCommand('/home/su/notes', 'gnome-terminal')).toBe(
				"gnome-terminal --working-directory='/home/su/notes'",
			);
		});

		it('path with spaces', () => {
			expect(buildCommand('/home/su/my notes', 'gnome-terminal')).toBe(
				"gnome-terminal --working-directory='/home/su/my notes'",
			);
		});
	});

	describe('Konsole', () => {
		it('basic path', () => {
			expect(buildCommand('/home/su/notes', 'konsole')).toBe(
				"konsole --workdir '/home/su/notes'",
			);
		});

		it('path with spaces', () => {
			expect(buildCommand('/home/su/my notes', 'konsole')).toBe(
				"konsole --workdir '/home/su/my notes'",
			);
		});
	});

	describe('xterm', () => {
		it('basic path', () => {
			expect(buildCommand('/home/su/notes', 'xterm')).toBe(
				'xterm -e "cd \\"/home/su/notes\\" && exec bash"',
			);
		});

		it('path with spaces', () => {
			expect(buildCommand('/home/su/my notes', 'xterm')).toBe(
				'xterm -e "cd \\"/home/su/my notes\\" && exec bash"',
			);
		});

		it('path with Chinese characters', () => {
			expect(buildCommand('/home/su/笔记', 'xterm')).toBe(
				'xterm -e "cd \\"/home/su/笔记\\" && exec bash"',
			);
		});
	});
});
