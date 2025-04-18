import moment from 'moment';
import { longDateFormats } from '../../../utils/dates';
import { formatValue } from '.';

const setLocale = code => {
    moment.locale(code);
    moment.updateLocale(code, {
        longDateFormat: longDateFormats[code],
        week: {
            dow: 1,
        },
    });
};
describe('formatValue', () => {
    before(() => {
        setLocale('en');
    });
    it('should leave number as is', () => {
        expect(formatValue('4')).to.eql('4');
    });
    it('should convert day in api format to locale format', () => {
        expect(formatValue('2020-02-02')).to.eql('02/02/2020');
    });
    it('should convert date time in api to locale format', () => {
        expect(formatValue('2020-02-02 02:20')).to.eql('02/02/2020 02:20');
    });
    it('should leave string as is', () => {
        expect(formatValue('hello')).to.eql('hello');
    });
});
