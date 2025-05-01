import { Period } from './models';
import {
    PERIOD_TYPE_DAY,
    PERIOD_TYPE_FINANCIAL_NOV,
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_QUARTER_NOV,
    PERIOD_TYPE_SIX_MONTH,
    PERIOD_TYPE_YEAR,
} from './constants';

let periodString;
let expectedPeriod;
let period;

let month;
const getMonthRange = m =>
    Array(m)
        .fill()
        .map((x, i) => i + 1);

describe('Periods model', () => {
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
    it("getPeriodType should return null if period type doesn' t exist", () => {
        expect(Period.getPeriodType('ZELDA')).to.eql(null);
    });
    describe('day string', () => {
        before(() => {
            periodString = '20200101';
            period = new Period(periodString);
            month = 1;
            expectedPeriod = {
                periodType: PERIOD_TYPE_DAY,
                month,
                day: 1,
                quarter: 1,
                semester: 1,
                year: 2020,
                periodString,
            };
        });
        it('should create a daily period object', () => {
            expect(period).to.eql(expectedPeriod);
        });
        it('asPeriodType should create a monthly period object', () => {
            expect(period.asPeriodType(PERIOD_TYPE_DAY)).to.eql(expectedPeriod);
        });
        it('toCode should return correct code', () => {
            expect(period.toCode()).to.eql('01/01/2020');
        });
        it('monthRange should throw an error', () => {
            expect(() => period.monthRange).to.throw(
                `Invalid period type ${expectedPeriod.periodType}`,
            );
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

        it('getPeriodType should correct period type', () => {
            expect(Period.getPeriodType('20201201')).to.eql(PERIOD_TYPE_DAY);
        });
        describe('isBefore', () => {
            it('should return true', () => {
                expect(Period.isBefore('20200101', '20200201')).to.eql(true);
            });
            it('should return true the same month and diff day', () => {
                expect(Period.isBefore('20200101', '20200105')).to.eql(true);
            });
            it('should return false', () => {
                expect(Period.isBefore('20200201', '20200101')).to.eql(false);
            });
        });
        describe('isAfter', () => {
            it('should return true', () => {
                expect(Period.isAfter('20200201', '20200101')).to.eql(true);
            });
            it('should return true the same month and diff day', () => {
                expect(Period.isAfter('20200105', '20200101')).to.eql(true);
            });
            it('should return false', () => {
                expect(Period.isAfter('20200101', '20200201')).to.eql(false);
            });
        });
    });

    describe('monthly string', () => {
        before(() => {
            periodString = '202001';
            period = new Period(periodString);
            month = 1;
            expectedPeriod = {
                periodType: PERIOD_TYPE_MONTH,
                month,
                day: 1,
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
        it('getPeriodType should correct period type', () => {
            expect(Period.getPeriodType('202012')).to.eql(PERIOD_TYPE_MONTH);
        });
        describe('isBefore', () => {
            it('should return true', () => {
                expect(Period.isBefore('202001', '202002')).to.eql(true);
            });
            it('should return false', () => {
                expect(Period.isBefore('202002', '202001')).to.eql(false);
            });
        });
        describe('isAfter', () => {
            it('should return true', () => {
                expect(Period.isAfter('202002', '202001')).to.eql(true);
            });
            it('should return false', () => {
                expect(Period.isAfter('202001', '202002')).to.eql(false);
            });
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
                day: 1,
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
        it('getPeriodType should correct period type', () => {
            expect(Period.getPeriodType('2020Q1')).to.eql(PERIOD_TYPE_QUARTER);
        });
        describe('isBefore', () => {
            it('should return true', () => {
                expect(Period.isBefore('2020Q1', '2020Q2')).to.eql(true);
            });
            it('should return false', () => {
                expect(Period.isBefore('2020Q2', '2020Q1')).to.eql(false);
            });
        });
        describe('isAfter', () => {
            it('should return true', () => {
                expect(Period.isAfter('2020Q2', '2020Q1')).to.eql(true);
            });
            it('should return false', () => {
                expect(Period.isAfter('2020Q1', '2020Q2')).to.eql(false);
            });
        });
    });


    describe('quarterly nov string', () => {
        before(() => {
            periodString = '2018NovQ1';
            period = new Period(periodString);
            expectedPeriod = {
                periodType: PERIOD_TYPE_QUARTER_NOV,
                month: 1,
                day: 1,
                quarter: 1,
                semester: 1,
                year: 2018,
                periodString,
            };
        });
        it('should create a quarterly period object', () => {
            expect(period).to.eql(expectedPeriod);
        });
        it('asPeriodType should create a quarterly period object', () => {
            expect(period.asPeriodType(PERIOD_TYPE_QUARTER_NOV)).to.eql(
                expectedPeriod,
            );
        });
        it('monthRange should return correct month range', () => {
            expect(period.monthRange).to.eql([11,12,1]);
        });
        it('toCode should return correct code', () => {
            expect(period.toCode()).to.eql('NovQ1/2018');
        });
        it('nextQuarter should return next quarter string', () => {
            expect(period.next(periodString)).to.eql(`2018NovQ2`);
        });
        it('previousQuarter should return previous year last quarter string', () => {
            expect(period.previous(periodString)).to.eql("2017NovQ4");
        });
        it('nextQuarter should return next year quarter string', () => {
            expect(period.next("2020NovQ4")).to.eql(`2021NovQ1`);
        });
        it('previousQuarter should return previous quarter string', () => {     
            expect(period.previous("2024NovQ4")).to.eql(`2024NovQ3`);
        });
        it('nextPeriods should return next 2 quarters', () => {
            expect(period.nextPeriods(2)).to.eql(['2018NovQ2', '2018NovQ3']);
        });
        it('previousPeriods should return previous 2 quarters', () => {
            expect(period.previousPeriods(2)).to.eql(['2017NovQ3', '2017NovQ4']);
        });
        it('getPeriodType should correct period type', () => {
            expect(Period.getPeriodType('2017NovQ3')).to.eql(PERIOD_TYPE_QUARTER_NOV);
        });
        describe('isBefore', () => {
            it('should return true', () => {
                expect(Period.isBefore('2017NovQ3', '2017NovQ4')).to.eql(true);
            });
            it('should return false', () => {
                expect(Period.isBefore('2017NovQ4', '2017NovQ3')).to.eql(false);
            });
        });
        describe('isAfter', () => {
            it('should return true', () => {
                expect(Period.isAfter('2017NovQ4', '2017NovQ3')).to.eql(true);
            });
            it('should return false', () => {
                expect(Period.isAfter('2017NovQ3', '2017NovQ4')).to.eql(false);
            });
        });
    });


    describe('financial nov string', () => {
        before(() => {
            periodString = '2018Nov';
            period = new Period(periodString);
            expectedPeriod = {
                periodType: PERIOD_TYPE_FINANCIAL_NOV,
                month: 10,
                day: 31,
                quarter: 1,
                semester: 2,
                year: 2018,
                periodString,
            };
        });
        it('should create a quarterly period object', () => {
            expect(period).to.eql(expectedPeriod);
        });
        it('asPeriodType should create a quarterly period object', () => {
            expect(period.asPeriodType(PERIOD_TYPE_FINANCIAL_NOV)).to.eql(
                expectedPeriod,
            );
        });
        it('monthRange should return correct month range', () => {
            expect(period.monthRange).to.eql([11,12,1,2,3,4,5,6,7,8,9,10]);
        });
        it('toCode should return correct code', () => {
            expect(period.toCode()).to.eql('2018Nov');
        });
        it('next should return next year string', () => {
            expect(period.next(periodString)).to.eql(`2019Nov`);
        });
        it('pervious should return previous year string', () => {
            expect(period.previous(periodString)).to.eql("2017Nov");
        });
        it('next should return next year quarter string', () => {
            expect(period.next("2020NovQ4")).to.eql(`2021NovQ1`);
        });
        it('nextPeriods should return next 2 years', () => {
            expect(period.nextPeriods(2)).to.eql(['2019Nov', '2020Nov']);
        });
        it('previousPeriods should return previous 2 years', () => {
            expect(period.previousPeriods(2)).to.eql(['2016Nov', '2017Nov']);
        });
        it('getPeriodType should correct period type', () => {
            expect(Period.getPeriodType('2017Nov')).to.eql(PERIOD_TYPE_FINANCIAL_NOV);
        });
        describe('isBefore', () => {
            it('should return true', () => {
                expect(Period.isBefore('2017Nov', '2018Nov')).to.eql(true);
            });
            it('should return false', () => {
                expect(Period.isBefore('2018Nov', '2017Nov')).to.eql(false);
            });
        });
        describe('isAfter', () => {
            it('should return true', () => {
                expect(Period.isAfter('2018Nov', '2017Nov')).to.eql(true);
            });
            it('should return false', () => {
                expect(Period.isAfter('2017Nov', '2017Nov')).to.eql(false);
            });
        });
    });


    describe('sixmonthly string', () => {
        before(() => {
            periodString = '2020S1';
            month = 6;
            period = new Period(periodString);
            expectedPeriod = {
                periodType: PERIOD_TYPE_SIX_MONTH,
                day: 1,
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
        it('getPeriodType should correct period type', () => {
            expect(Period.getPeriodType('2020S1')).to.eql(
                PERIOD_TYPE_SIX_MONTH,
            );
        });
        describe('isBefore', () => {
            it('should return true', () => {
                expect(Period.isBefore('2020S1', '2020S2')).to.eql(true);
            });
            it('should return false', () => {
                expect(Period.isBefore('2020S2', '2020S1')).to.eql(false);
            });
        });
        describe('isAfter', () => {
            it('should return true', () => {
                expect(Period.isAfter('2020S2', '2020S1')).to.eql(true);
            });
            it('should return false', () => {
                expect(Period.isAfter('2020S1', '2020S2')).to.eql(false);
            });
        });
    });

    describe('yearly string', () => {
        before(() => {
            periodString = '2020';
            month = 12;
            period = new Period(periodString);
            expectedPeriod = {
                periodType: PERIOD_TYPE_YEAR,
                day: 31,
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
        it('getPeriodType should correct period type', () => {
            expect(Period.getPeriodType('2020')).to.eql(PERIOD_TYPE_YEAR);
        });
        describe('isBefore', () => {
            it('should return true', () => {
                expect(Period.isBefore('2020', '2021')).to.eql(true);
            });
            it('should return false', () => {
                expect(Period.isBefore('2022', '2021')).to.eql(false);
            });
            it('should return false if same year', () => {
                expect(Period.isBefore('2021', '2021')).to.eql(false);
            });
        });
        describe('isAfter', () => {
            it('should return true', () => {
                expect(Period.isAfter('2021', '2020')).to.eql(true);
            });
            it('should return false', () => {
                expect(Period.isAfter('2020', '2021')).to.eql(false);
            });
            it('should return false if same year', () => {
                expect(Period.isAfter('2021', '2021')).to.eql(false);
            });
        });
    });

    describe('padMonth', () => {
        it('should return a string starting with 0 if smaller than 9', () => {
            const m = 1;
            expect(Period.padMonth(m)).to.eql(`0${m}`);
        });
        it('should return same number if bigger than 9', () => {
            const m = 10;
            expect(Period.padMonth(m)).to.eql(m);
        });
    });
});
