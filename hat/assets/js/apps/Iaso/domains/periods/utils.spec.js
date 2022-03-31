import { textPlaceholder } from 'bluesquare-components';
import { getPrettyPeriod } from './utils';

describe('getPrettyPeriod', () => {
    it('should return textPlaceholder if no periodString', () => {
        expect(getPrettyPeriod()).to.eql(textPlaceholder);
    });
    it('for month should return month', () => {
        expect(getPrettyPeriod('202001', x => x.defaultMessage)).to.eql(
            '01-2020 (January)',
        );
    });
    it('for year should return a year', () => {
        expect(getPrettyPeriod('2020', x => x.defaultMessage)).to.eql('2020');
    });
});
