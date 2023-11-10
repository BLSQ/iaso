import { convertValueIfDate, DateTimeCell, DateTimeCellRfc, DateCell, } from './DateTimeCell';
import { apiDateFormats, getLocaleDateFormat, longDateFormats } from '../../utils/dates';
import moment from 'moment';
import { textPlaceholder } from 'bluesquare-components';

const locales = Object.keys(longDateFormats);

describe('DateTimeCell', () => {
    it('should return the placeholder if value is null', () => {
        const cellInfo = { value: null };
        expect(DateTimeCell(cellInfo)).to.equal(textPlaceholder);
    });
    it('should return the formatted date if value is a timestamp', () => {
        const cellInfo = { value: 1680250188.659707 }; // timestamp for 31/03/2023 10:09
        expect(DateTimeCell(cellInfo)).to.equal('31/03/2023 10:09');
    });
});

describe('DateTimeCellRfc', () => {
    locales.forEach(locale => {
        moment.locale(locale);
        it('should return the placeholder if value is null', () => {
            const cellInfo = { value: null };
            expect(DateTimeCellRfc(cellInfo)).to.equal(textPlaceholder);
        });
        it('should return the formatted date if value is a RFC 2822 or ISO 8601 date', () => {
            const cellInfo = { value: '2021-07-29T00:00:00Z' };
            const expected = moment(cellInfo.value).format(getLocaleDateFormat('LTS'));
            expect(DateTimeCellRfc(cellInfo)).to.equal(expected);
        });
    });
});

describe('DateCell', () => {
    locales.forEach(locale => {
        moment.locale(locale);
        it('should return the placeholder if value is null', () => {
            const cellInfo = { value: null };
            expect(DateCell(cellInfo)).to.equal(textPlaceholder);
        });
        it('should return the formatted date if value is a timestamp', () => {
            const cellInfo = { value: 1627545600000 }; // timestamp for 2021-07-29
            const expected = moment(cellInfo.value).format(getLocaleDateFormat('L'));
            expect(DateCell(cellInfo)).to.equal(expected);
        });
    });
});


describe('convertValueIfDate', () => {
    it('should return the value if it does not match any apiDateFormat', () => {
        const nonDateFormatValues = [
            'This is not a date format',
            12345,
            [1, 2, 3, 4, 5],
            { key: 'value' },
        ];
        nonDateFormatValues.forEach(value => {
            expect(convertValueIfDate(value)).to.equal(value);
        });
    });
    it('should correctly map all apiDateFormats to moment.js format', () => {
        locales.forEach(locale => {
            moment.locale(locale);
            apiDateFormats.forEach(({ apiFormat, momentFormat }) => {
                const dateString = moment().format(apiFormat);
                const expected = moment(dateString, apiFormat).format(momentFormat);
                expect(convertValueIfDate(dateString)).to.equal(expected);
            });
        });
        // Reset locale to default
        moment.locale('en');
    });
});

