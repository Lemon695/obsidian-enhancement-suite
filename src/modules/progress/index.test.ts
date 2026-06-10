import { describe, expect, it } from 'vitest';
import { calculateProgressBarState } from './index';

describe('calculateProgressBarState', () => {
	it('keeps the bar pinned to the visible top while updating width', () => {
		expect(calculateProgressBarState(120, 1000, 400)).toEqual({
			width: '20.0%',
			transform: 'translateY(120px)',
		});
	});

	it('returns zero progress for notes that do not overflow', () => {
		expect(calculateProgressBarState(0, 400, 400)).toEqual({
			width: '0.0%',
			transform: 'translateY(0px)',
		});
	});

	it('clamps negative and overflow scroll positions safely', () => {
		expect(calculateProgressBarState(-20, 1000, 400)).toEqual({
			width: '0.0%',
			transform: 'translateY(0px)',
		});

		expect(calculateProgressBarState(900, 1000, 400)).toEqual({
			width: '100.0%',
			transform: 'translateY(900px)',
		});
	});
});
