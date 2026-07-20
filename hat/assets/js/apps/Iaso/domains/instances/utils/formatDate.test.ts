import { formatFieldDate, formatTimestamp } from './formatDate';

describe('formatFieldDate', () => {
    it('keeps a date-only value as is', () => {
        expect(formatFieldDate('2025-06-23')).to.equal('2025-06-23');
    });
    it('drops the seconds and timezone from an ISO datetime', () => {
        expect(formatFieldDate('2026-07-18T16:18:40.530+02:00')).to.equal(
            '2026-07-18 16:18',
        );
    });
    it('returns an unparseable value untouched', () => {
        expect(formatFieldDate('16:18:40')).to.equal('16:18:40');
        expect(formatFieldDate('not a date')).to.equal('not a date');
    });
    it('handles empty / non-string values', () => {
        expect(formatFieldDate('')).to.equal('');
        expect(formatFieldDate(undefined)).to.equal('');
    });
});

describe('formatTimestamp', () => {
    it('formats a unix seconds timestamp as date and time', () => {
        // 2026-07-18 16:18 UTC
        expect(formatTimestamp(1784391480)).to.match(
            /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
        );
    });
    it('shows a placeholder for a missing timestamp', () => {
        expect(formatTimestamp(undefined)).to.equal('--');
    });
});
