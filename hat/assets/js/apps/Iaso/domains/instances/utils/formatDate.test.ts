import moment from 'moment';
import { formatFieldDate, formatTimestamp } from './formatDate';

// the language config maps L -> DD/MM/YYYY and LTS -> DD/MM/YYYY HH:mm
const LOCALE_DATE = /^\d{2}\/\d{2}\/\d{4}$/;
const LOCALE_DATE_TIME = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;

describe('formatFieldDate', () => {
    beforeAll(() => moment.locale('en'));

    it('renders a date-only value in the locale date format', () => {
        expect(formatFieldDate('2025-06-23')).to.equal('23/06/2025');
    });
    it('renders an ISO datetime in the locale date+time format, without seconds or timezone', () => {
        expect(formatFieldDate('2026-07-18T16:18:40.530+02:00')).to.match(
            LOCALE_DATE_TIME,
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
    beforeAll(() => moment.locale('en'));

    it('formats a unix seconds timestamp in the locale date+time format', () => {
        expect(formatTimestamp(1784391480)).to.match(LOCALE_DATE_TIME);
    });
    it('shows a placeholder for a missing timestamp', () => {
        expect(formatTimestamp(undefined)).to.equal('--');
    });
    it('uses the locale date format tokens', () => {
        expect(formatFieldDate('2025-01-02')).to.match(LOCALE_DATE);
    });
});
