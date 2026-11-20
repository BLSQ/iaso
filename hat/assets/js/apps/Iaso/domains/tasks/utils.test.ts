import { describe, expect, it } from 'vitest';
import { formatDuration, formatOffset } from './utils';

describe('formatDuration', () => {
    it.each([
        [0.2, '< 1 s'],
        [38, '38 s'],
        [60, '1 min'],
        [252, '4 min 12 s'],
        [7500, '2 h 5 min'],
        [90061, '25 h 1 min'],
    ])('formats %s seconds as %s', (seconds, expected) => {
        expect(formatDuration(seconds)).toBe(expected);
    });
});

describe('formatOffset', () => {
    it.each([
        [0, '+0:00'],
        [42, '+0:42'],
        [252, '+4:12'],
        [3723, '+1:02:03'],
    ])('formats %s seconds as %s', (seconds, expected) => {
        expect(formatOffset(seconds)).toBe(expected);
    });
});
