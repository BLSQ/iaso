import { Period } from './models';
import {
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_SIX_MONTH,
    PERIOD_TYPE_YEAR,
} from './constants';
import { textPlaceholder } from '../../constants/uiConstants';

let periodString;
let expectedPeriod;
let period;

let month;
const getMonthRange = m =>
    Array(m)
        .fill()
        .map((x, i) => i + 1);

describe('Periods model', () => {
    describe('monthly string', () => {
        before(() => {
            periodString = '202001';
            period = new Period(periodString);
            month = 1;
            expectedPeriod = {
                periodType: PERIOD_TYPE_MONTH,
                month,
                quarter: 1,
                semester: 1,
                year: 2020,
                periodString,
            };
        });
        it('should create a monthly period object', () => {
            expect(period).to.eql(expectedPeriod);
        });
        it('asPeriodType should create a monthly period object', () => {
            expect(period.asPeriodType(PERIOD_TYPE_MONTH)).to.eql(
                expectedPeriod,
            );
        });
        it('toCode should return correct code', () => {
            expect(period.toCode()).to.eql('01/2020');
        });
        it('monthRange should return correct month range', () => {
            expect(period.monthRange).to.eql(getMonthRange(month));
        });
        describe('getPrettyPeriod', () => {
            it('should return textPlaceholder if no periodString', () => {
                expect(Period.getPrettyPeriod()).to.eql(textPlaceholder);
            });
            it('should return correct string', () => {
                expect(Period.getPrettyPeriod(periodString)).to.eql('01-2020');
            });
        });
        it('nextYear should return next year string', () => {
            expect(period.nextYear(periodString)).to.eql(
                `${expectedPeriod.year + 1}`,
            );
        });
        it('previousYear should return previous year string', () => {
            expect(period.previousYear(periodString)).to.eql(
                `${expectedPeriod.year - 1}`,
            );
        });
        it('nextFinancialJuly should return next year july string', () => {
            expect(period.nextFinancialJuly(periodString)).to.eql(
                `${expectedPeriod.year + 1}July`,
            );
        });
        it('previousFinancialJuly should return next year july string', () => {
            expect(period.previousFinancialJuly(periodString)).to.eql(
                `${expectedPeriod.year - 1}July`,
            );
        });
        it('nextYearMonth should return next month of the year string', () => {
            expect(period.nextYearMonth(periodString)).to.eql(
                `${expectedPeriod.year}0${expectedPeriod.month + 1}`,
            );
        });
        it('nextYearMonth should return next month of next year string', () => {
            expect(period.nextYearMonth('202012')).to.eql(
                `${expectedPeriod.year + 1}01`,
            );
        });
        it('previousYearMonth should return next month of previous year string', () => {
            expect(period.previousYearMonth(periodString)).to.eql(
                `${expectedPeriod.year - 1}12`,
            );
        });
        it('previousYearMonth should return previous month of the year string', () => {
            expect(period.previousYearMonth('202012')).to.eql(
                `${expectedPeriod.year}11`,
            );
        });
        it('nextPeriods should return next 2 months', () => {
            expect(period.nextPeriods(2)).to.eql(['202002', '202003']);
        });
        it('previousPeriods should return previous 2 months', () => {
            expect(period.previousPeriods(2)).to.eql(['201911', '201912']);
        });
    });

    describe('quarterly string', () => {
        before(() => {
            periodString = '2020Q1';
            month = 3;
            period = new Period(periodString);
            expectedPeriod = {
                periodType: PERIOD_TYPE_QUARTER,
                month,
                quarter: 1,
                semester: 1,
                year: 2020,
                periodString,
            };
        });
        it('should create a quarterly period object', () => {
            expect(period).to.eql(expectedPeriod);
        });
        it('asPeriodType should create a quarterly period object', () => {
            expect(period.asPeriodType(PERIOD_TYPE_QUARTER)).to.eql(
                expectedPeriod,
            );
        });
        it('monthRange should return correct month range', () => {
            expect(period.monthRange).to.eql(getMonthRange(month));
        });
        it('toCode should return correct code', () => {
            expect(period.toCode()).to.eql('Q1/2020');
        });
        it('nextQuarter should return next quarter string', () => {
            expect(period.nextQuarter(periodString)).to.eql(
                `${expectedPeriod.year}Q2`,
            );
        });
        it('previousQuarter should return previous year last quarter string', () => {
            expect(period.previousQuarter(periodString)).to.eql(
                `${expectedPeriod.year - 1}Q4`,
            );
        });
        it('nextQuarter should return next year quarter string', () => {
            periodString = '2020Q4';
            expect(period.nextQuarter(periodString)).to.eql(
                `${expectedPeriod.year + 1}Q1`,
            );
        });
        it('previousQuarter should return previous quarter string', () => {
            periodString = '2020Q4';
            expect(period.previousQuarter(periodString)).to.eql(
                `${expectedPeriod.year}Q3`,
            );
        });
        it('nextPeriods should return next 2 quarters', () => {
            expect(period.nextPeriods(2)).to.eql(['2020Q2', '2020Q3']);
        });
        it('previousPeriods should return previous 2 quarters', () => {
            expect(period.previousPeriods(2)).to.eql(['2019Q3', '2019Q4']);
        });
    });

    describe('sixmonthly string', () => {
        before(() => {
            periodString = '2020S1';
            month = 6;
            period = new Period(periodString);
            expectedPeriod = {
                periodType: PERIOD_TYPE_SIX_MONTH,
                month,
                quarter: 2,
                semester: 1,
                year: 2020,
                periodString,
            };
        });
        it('should create a sixmonthly period object', () => {
            expect(period).to.eql(expectedPeriod);
        });
        it('asPeriodType should create a sixmonthly period object', () => {
            expect(period.asPeriodType(PERIOD_TYPE_SIX_MONTH)).to.eql(
                expectedPeriod,
            );
        });
        it('monthRange should return correct month range', () => {
            expect(period.monthRange).to.eql(getMonthRange(month));
        });
        it('toCode should return correct code', () => {
            expect(period.toCode()).to.eql('S1/2020');
        });
        it('nextSixMonth should return next semester string', () => {
            expect(period.nextSixMonth(periodString)).to.eql(
                `${expectedPeriod.year}S2`,
            );
        });
        it('previousSixMonth should return previous year last semester string', () => {
            expect(period.previousSixMonth(periodString)).to.eql(
                `${expectedPeriod.year - 1}S2`,
            );
        });
        it('nextSixMonth should return next year semester string', () => {
            periodString = '2020S2';
            expect(period.nextSixMonth(periodString)).to.eql(
                `${expectedPeriod.year + 1}S1`,
            );
        });
        it('previousSixMonth should return previous semester string', () => {
            periodString = '2020S2';
            expect(period.previousSixMonth(periodString)).to.eql(
                `${expectedPeriod.year}S1`,
            );
        });
        it('nextPeriods should return next 2 semesters', () => {
            expect(period.nextPeriods(2)).to.eql(['2020S2', '2021S1']);
        });
        it('previousPeriods should return previous 2 semesters', () => {
            expect(period.previousPeriods(2)).to.eql(['2019S1', '2019S2']);
        });
    });

    describe('yearly string', () => {
        before(() => {
            periodString = '2020';
            month = 12;
            period = new Period(periodString);
            expectedPeriod = {
                periodType: PERIOD_TYPE_YEAR,
                month,
                quarter: 4,
                semester: 2,
                year: 2020,
                periodString,
            };
        });
        it('should create a yearly period object', () => {
            expect(period).to.eql(expectedPeriod);
        });
        it('asPeriodType should create a yearly period object', () => {
            expect(period.asPeriodType(PERIOD_TYPE_YEAR)).to.eql(
                expectedPeriod,
            );
        });
        it('monthRange should return correct month range', () => {
            expect(period.monthRange).to.eql(getMonthRange(month));
        });
        it('toCode should return correct code', () => {
            expect(period.toCode()).to.eql(periodString);
        });
        it('getPrettyPeriod should return periodString', () => {
            expect(Period.getPrettyPeriod(periodString)).to.eql(periodString);
        });
        it('nextQuarter should return quarter string invalid', () => {
            expect(period.nextQuarter(periodString)).to.eql('2020QNaN');
        });
        it('previousQuarter should return quarter string invalid', () => {
            expect(period.previousQuarter(periodString)).to.eql('2020QNaN');
        });
        it('nextSixMonth should return semester string invalid', () => {
            expect(period.nextSixMonth(periodString)).to.eql('2020SNaN');
        });
        it('previousSixMonth should return semester string invalid', () => {
            expect(period.previousSixMonth(periodString)).to.eql('2020SNaN');
        });
        it('nextPeriods should return next 2 years', () => {
            expect(period.nextPeriods(2)).to.eql(['2021', '2022']);
        });
        it('previousPeriods should return previous 2 years', () => {
            expect(period.previousPeriods(2)).to.eql(['2018', '2019']);
        });
    });

    it('should raise an error if period is invalid', () => {
        periodString = 'ZELDA';
        expect(() => new Period(periodString)).to.throw(
            `Invalid period string ${periodString}`,
        );
    });
    it('asPeriodType should raise an error if invalid period type', () => {
        period = new Period('2020');
        const periodType = 'ZELDA';
        expect(() => period.asPeriodType(periodType)).to.throw(
            `Invalid period type ${periodType}`,
        );
    });
    it('previous should raise an error if invalid period format', () => {
        const tempPeriod = 'ZELDA';
        expect(() => period.previous(tempPeriod)).to.throw(
            `unsupported period format ${tempPeriod}`,
        );
    });
    it('next should raise an error if invalid period format', () => {
        const tempPeriod = 'ZELDA';
        expect(() => period.next(tempPeriod)).to.throw(
            `unsupported period format ${tempPeriod}`,
        );
    });
    it('previous should raise an error if invalid period format', () => {
        const tempPeriod = 'ZELDA';
        expect(() => period.previous(tempPeriod)).to.throw(
            `unsupported period format ${tempPeriod}`,
        );
    });
    it('next financial july should return correct financial july', () => {
        const tempPeriod = '2020July';
        expect(period.next(tempPeriod)).to.eql('2021July');
    });
    it('previous financial july should return correct financial july', () => {
        const tempPeriod = '2020July';
        expect(period.previous(tempPeriod)).to.eql('2019July');
    });
    describe('padMonth', () => {
        it('should return a string starting with 0 if smaller than 9', () => {
            const m = 1;
            expect(period.padMonth(m)).to.eql(`0${m}`);
        });
        it('should return same number if bigger than 9', () => {
            const m = 10;
            expect(period.padMonth(m)).to.eql(m);
        });
    });
});
