import { textPlaceholder } from 'bluesquare-components';
import { getNumberOfIsoWeeksInYear, getPrettyPeriod } from './utils';

function testFormatMessage(msg, values) {
  values = values || {};
  var template =
    typeof msg === 'string'
      ? msg
      : (msg && msg.defaultMessage) || '';

  return template.replace(/\{(\w+)\}/g, function (_m, key) {
    if (!Object.prototype.hasOwnProperty.call(values, key)) return '{' + key + '}';
    return String(values[key]);
  });
}

// optional strict version (fails if a placeholder is missing)
function strictTestFormatMessage(msg, values) {
  var out = testFormatMessage(msg, values);
  if (/\{\w+\}/.test(out)) throw new Error('Unreplaced placeholder in: ' + out);
  return out;
}


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

    it('for year should return a year', () => {
        expect(getPrettyPeriod('2020W53', testFormatMessage)).to.eql('Week N° 53 (28/12/2020 - 03/01/2021)');
    });

});


describe('getNumberOfIsoWeeksInYear', () => {
      it('should handle week leap years', () => {
        expect(getNumberOfIsoWeeksInYear(2025)).to.eql(52)
        expect(getNumberOfIsoWeeksInYear(2026)).to.eql(53)
        expect(getNumberOfIsoWeeksInYear(2027)).to.eql(52)
      })
})
