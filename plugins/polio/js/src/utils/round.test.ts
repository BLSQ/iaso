import { formatRoundDate, formatRoundDateRange } from './round';

vi.mock('Iaso/utils/dates', () => ({
    getLocaleDateFormat: () => 'DD/MM/YYYY',
}));

describe('formatRoundDate', () => {
    it.each([undefined, null, ''])(
        'returns undefined for empty input %p',
        date => {
            expect(formatRoundDate(date)).toBeUndefined();
        },
    );

    it('returns undefined for an invalid date', () => {
        expect(formatRoundDate('not-a-date')).toBeUndefined();
    });

    it('formats an ISO date with the locale L format', () => {
        expect(formatRoundDate('2024-03-15')).toBe('15/03/2024');
    });

    it('formats an ISO datetime using the date part', () => {
        expect(formatRoundDate('2024-03-15T12:00:00')).toBe('15/03/2024');
    });
});

describe('formatRoundDateRange', () => {
    const toLabel = 'to';

    it('joins start and end with the to label', () => {
        expect(
            formatRoundDateRange('2024-03-15', '2024-03-20', toLabel),
        ).toBe('15/03/2024 to 20/03/2024');
    });

    it('returns only the start when the end is missing', () => {
        expect(
            formatRoundDateRange('2024-03-15', null, toLabel),
        ).toBe('15/03/2024');
    });

    it('returns only the end when the start is missing', () => {
        expect(
            formatRoundDateRange(undefined, '2024-03-20', toLabel),
        ).toBe('20/03/2024');
    });

    it('returns only the valid side when the other date is invalid', () => {
        expect(
            formatRoundDateRange('not-a-date', '2024-03-20', toLabel),
        ).toBe('20/03/2024');
        expect(
            formatRoundDateRange('2024-03-15', 'not-a-date', toLabel),
        ).toBe('15/03/2024');
    });

    it('returns undefined when both dates are missing', () => {
        expect(formatRoundDateRange(null, undefined, toLabel)).toBeUndefined();
    });
});
