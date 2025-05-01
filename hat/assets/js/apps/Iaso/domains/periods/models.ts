/* eslint-disable radix */
import _ from 'lodash/fp';
import {
    PERIOD_TYPE_DAY,
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_QUARTER_NOV,
    PERIOD_TYPE_SIX_MONTH,
    PERIOD_TYPE_YEAR,
    PERIOD_TYPE_FINANCIAL_NOV,
} from './constants';

export type PeriodObject = {
    month: number;
    quarter: number;
    semester: number;
    year: number;
    day: number;
};

const QUARTER_NOV_MONTHS = {
    1: [11, 12, 1],
    2: [2, 3, 4],
    3: [5, 6, 7],
    4: [8, 9, 10],
};

export class Period {
    private readonly periodType: string;

    private readonly year: number;

    private readonly month: number;

    private readonly quarter: number;

    private readonly semester: number;

    private readonly day: number;

    public readonly periodString: string;

    constructor(periodString: string) {
        const [periodType, periodParts] = Period.parse(periodString);
        this.periodType = periodType;
        this.month = periodParts.month;
        this.quarter = periodParts.quarter;
        this.semester = periodParts.semester;
        this.year = periodParts.year;
        this.day = periodParts.day;
        this.periodString = periodString;
    }

    // Cast period as another period type. (Throw away data?)
    // seems to be done. By converting it to as string and then converting it
    // letting the new Period constructor parse it back
    asPeriodType(periodType: string): Period {
        let periodTypeString;
        switch (periodType) {
            case PERIOD_TYPE_DAY:
                periodTypeString = `${this.year}${String(this.month).padStart(
                    2,
                    '0',
                )}${String(this.day).padStart(2, '0')}`;
                break;
            case PERIOD_TYPE_MONTH:
                periodTypeString = `${this.year}${String(this.month).padStart(
                    2,
                    '0',
                )}`;
                break;
            case PERIOD_TYPE_QUARTER_NOV:
                periodTypeString = `${this.year}NovQ${this.quarter}`;
                break;
            case PERIOD_TYPE_QUARTER:
                periodTypeString = `${this.year}Q${this.quarter}`;
                break;
            case PERIOD_TYPE_SIX_MONTH:
                periodTypeString = `${this.year}S${this.semester}`;
                break;
            case PERIOD_TYPE_YEAR:
                periodTypeString = `${this.year}`;
                break;
            case PERIOD_TYPE_FINANCIAL_NOV:
                periodTypeString = `${this.year}Nov`;
                break;
            default:
                throw new Error(`Invalid period type ${periodType}`);
        }

        return new Period(periodTypeString);
    }

    get monthRange(): number[] {
        switch (this.periodType) {
            case PERIOD_TYPE_DAY:
                throw new Error(`Invalid period type ${this.periodType}`);
            case PERIOD_TYPE_MONTH:
                return [this.month];
            case PERIOD_TYPE_QUARTER_NOV:
                return QUARTER_NOV_MONTHS[this.quarter];
            case PERIOD_TYPE_QUARTER:
                return _.range(this.month - 2, this.month + 1);
            case PERIOD_TYPE_SIX_MONTH:
                return _.range(this.month - 5, this.month + 1);
            case PERIOD_TYPE_FINANCIAL_NOV:
                return [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            default:
                return _.range(this.month - 11, this.month + 1);
        }
    }

    static toDate(
        value?: Partial<PeriodObject> | null,
    ): string | undefined | null {
        if (!value) return value;
        const result = `${value.year}${String(value?.month ?? '1').padStart(
            2,
            '0',
        )}${String(value?.day ?? '1').padStart(2, '0')}`;
        return result;
    }

    toCode(): string {
        switch (this.periodType) {
            case PERIOD_TYPE_DAY:
                return `${String(this.day).padStart(2, '0')}/${String(
                    this.month,
                ).padStart(2, '0')}/${this.year}`;
            case PERIOD_TYPE_MONTH:
                return `${String(this.month).padStart(2, '0')}/${this.year}`;
            case PERIOD_TYPE_QUARTER:
                return `Q${this.quarter}/${this.year}`;
            case PERIOD_TYPE_QUARTER_NOV:
                return `NovQ${this.quarter}/${this.year}`;
            case PERIOD_TYPE_SIX_MONTH:
                return `S${this.semester}/${this.year}`;
            case PERIOD_TYPE_FINANCIAL_NOV:
                return `${this.year}Nov`;
            default:
                return `${this.year}`;
        }
    }

    static parse(periodString: string): [string, PeriodObject] {
        if (periodString.includes('NovQ')) {
            return [
                PERIOD_TYPE_QUARTER_NOV,
                Period.parseQuarterNovString(periodString),
            ];
        }
        if (periodString.includes('Nov')) {
            return [
                PERIOD_TYPE_FINANCIAL_NOV,
                Period.parseFinancialNovString(periodString),
            ];
        }
        if (periodString.includes('Q')) {
            return [
                PERIOD_TYPE_QUARTER,
                Period.parseQuarterString(periodString),
            ];
        }
        if (periodString.includes('S')) {
            return [
                PERIOD_TYPE_SIX_MONTH,
                Period.parseSemesterString(periodString),
            ];
        }
        if (periodString.length === 6) {
            return [PERIOD_TYPE_MONTH, Period.parseMonthString(periodString)];
        }
        if (periodString.length === 8) {
            return [PERIOD_TYPE_DAY, Period.parseDayString(periodString)];
        }
        if (periodString.length === 4) {
            return [PERIOD_TYPE_YEAR, Period.parseYearString(periodString)];
        }

        throw new Error(`Invalid period string ${periodString}`);
    }

    static getPeriodType(periodString: string): string | null {
        if (periodString.includes('NovQ') && periodString.length === 9) {
            return PERIOD_TYPE_QUARTER_NOV;
        }
        if (periodString.includes('Nov') && periodString.length === 7) {
            return PERIOD_TYPE_FINANCIAL_NOV;
        }
        if (periodString.includes('Q') && periodString.length === 6) {
            return PERIOD_TYPE_QUARTER;
        }
        if (periodString.includes('S') && periodString.length === 6) {
            return PERIOD_TYPE_SIX_MONTH;
        }
        if (periodString.length === 6) {
            return PERIOD_TYPE_MONTH;
        }
        if (periodString.length === 8) {
            return PERIOD_TYPE_DAY;
        }
        if (periodString.length === 4) {
            return PERIOD_TYPE_YEAR;
        }

        return null;
    }

    static parseQuarterString(quarterString: string): PeriodObject {
        const [year, quarter] = quarterString.split('Q').map(Number);

        return {
            month: quarter * 3,
            quarter,
            semester: Math.ceil(quarter / 2),
            year,
            day: 1,
        };
    }

    static parseQuarterNovString(quarterString: string): PeriodObject {
        const [year, quarter] = quarterString.split('NovQ').map(Number);
        const month = QUARTER_NOV_MONTHS[quarter].at(-1);
        return {
            month,
            quarter,
            semester: Math.ceil(quarter / 2),
            year,
            day: 1,
        };
    }

    static parseSemesterString(semesterString: string): PeriodObject {
        const [year, semester] = semesterString.split('S').map(Number);

        return {
            month: semester * 6,
            quarter: semester * 2,
            semester,
            year,
            day: 1,
        };
    }

    static parseMonthString(monthString: string): PeriodObject {
        const year = Number(monthString.slice(0, 4));
        const month = Number(monthString.slice(4, 6));

        return {
            month,
            quarter: Math.ceil(month / 3),
            semester: Math.ceil(month / 6),
            year,
            day: 1,
        };
    }

    static parseDayString(monthString: string): PeriodObject {
        const year = Number(monthString.slice(0, 4));
        const month = Number(monthString.slice(4, 6));
        const day = Number(monthString.slice(6, 8));

        return {
            month,
            quarter: Math.ceil(month / 3),
            semester: Math.ceil(month / 6),
            year,
            day,
        };
    }

    static parseYearString(yearString: string): PeriodObject {
        const year = Number(yearString);

        return {
            month: 12,
            quarter: 4,
            semester: 2,
            year,
            day: 31,
        };
    }
    static parseFinancialNovString(yearString: string): PeriodObject {
        const year = Number(yearString.slice(0, 4));
        return {
            month: 10,
            quarter: 1,
            semester: 2,
            year,
            day: 31,
        };
    }

    static padMonth(n: number): string | number {
        return n < 10 ? `0${n}` : n;
    }

    static isBefore(p1String: string, p2String: string): boolean {
        const p1 = new Period(p1String);
        const p2 = new Period(p2String);
        if (p1.year < p2.year) {
            return true;
        }
        if (p1.year === p2.year) {
            if (p1.periodType === PERIOD_TYPE_DAY) {
                return (
                    p1.month < p2.month ||
                    (p1.month === p2.month && p1.day < p2.day)
                );
            }
            if (p1.periodType === PERIOD_TYPE_MONTH) {
                return p1.month < p2.month;
            }
            if (p1.periodType === PERIOD_TYPE_QUARTER) {
                return p1.quarter < p2.quarter;
            }
            if (p1.periodType === PERIOD_TYPE_QUARTER_NOV) {
                return p1.quarter < p2.quarter;
            }
            if (p1.periodType === PERIOD_TYPE_SIX_MONTH) {
                return p1.semester < p2.semester;
            }
            return false;
        }
        return false;
    }

    static isBeforeOrEqual(p1String: string, p2String: string): boolean {
        const p1 = new Period(p1String);
        const p2 = new Period(p2String);
        if (p1.year < p2.year) {
            return true;
        }
        if (p1.year === p2.year) {
            if (p1.periodType === PERIOD_TYPE_DAY) {
                return (
                    p1.month < p2.month ||
                    (p1.month === p2.month && p1.day <= p2.day)
                );
            }
            if (p1.periodType === PERIOD_TYPE_MONTH) {
                return p1.month <= p2.month;
            }
            if (p1.periodType === PERIOD_TYPE_QUARTER) {
                return p1.quarter <= p2.quarter;
            }
            if (p1.periodType === PERIOD_TYPE_QUARTER_NOV) {
                return p1.quarter <= p2.quarter;
            }
            if (p1.periodType === PERIOD_TYPE_SIX_MONTH) {
                return p1.semester <= p2.semester;
            }
            if (
                p1.periodType === PERIOD_TYPE_YEAR ||
                p1.periodType === PERIOD_TYPE_FINANCIAL_NOV
            ) {
                return true;
            }
        }
        return false;
    }

    static isAfter(p1String: string, p2String: string): boolean {
        const p1 = new Period(p1String);
        const p2 = new Period(p2String);
        if (p1.year > p2.year) {
            return true;
        }
        if (p1.year === p2.year) {
            if (p1.periodType === PERIOD_TYPE_DAY) {
                return (
                    p1.month > p2.month ||
                    (p1.month === p2.month && p1.day > p2.day)
                );
            }
            if (p1.periodType === PERIOD_TYPE_MONTH) {
                return p1.month > p2.month;
            }
            if (p1.periodType === PERIOD_TYPE_QUARTER) {
                return p1.quarter > p2.quarter;
            }
            if (p1.periodType === PERIOD_TYPE_QUARTER_NOV) {
                return p1.quarter > p2.quarter;
            }
            if (p1.periodType === PERIOD_TYPE_SIX_MONTH) {
                return p1.semester > p2.semester;
            }
            return false;
        }
        return false;
    }

    static isAfterOrEqual(p1String: string, p2String: string): boolean {
        const p1 = new Period(p1String);
        const p2 = new Period(p2String);
        if (p1.year > p2.year) {
            return true;
        }
        if (p1.year === p2.year) {
            if (p1.periodType === PERIOD_TYPE_DAY) {
                return (
                    p1.month >= p2.month ||
                    (p1.month === p2.month && p1.day >= p2.day)
                );
            }
            if (p1.periodType === PERIOD_TYPE_MONTH) {
                return p1.month >= p2.month;
            }
            if (p1.periodType === PERIOD_TYPE_QUARTER) {
                return p1.quarter >= p2.quarter;
            }
            if (p1.periodType === PERIOD_TYPE_QUARTER_NOV) {
                return p1.quarter >= p2.quarter;
            }
            if (p1.periodType === PERIOD_TYPE_SIX_MONTH) {
                return p1.semester >= p2.semester;
            }
            if (
                p1.periodType === PERIOD_TYPE_YEAR ||
                p1.periodType === PERIOD_TYPE_FINANCIAL_NOV
            ) {
                return true;
            }
        }
        return false;
    }

    // more period functions -----------------

    nextYearMonth(period: string): string {
        let year = parseInt(period.slice(0, 4), 0);
        let month = parseInt(period.slice(4, 6), 0);
        if (month === 12) {
            year += 1;
            month = 1;
        } else {
            month += 1;
        }
        return `${year}${Period.padMonth(month)}`;
    }

    previousYearMonth(period: string): string {
        let year = parseInt(period.slice(0, 4), 0);
        let month = parseInt(period.slice(4, 6), 0);
        if (month === 1) {
            year -= 1;
            month = 12;
        } else {
            month -= 1;
        }
        return `${year}${Period.padMonth(month)}`;
    }

    nextYear(period: string): string {
        const year = parseInt(period.slice(0, 4), 0);
        return `${year + 1}`;
    }

    previousYear(period: string): string {
        const year = parseInt(period.slice(0, 4), 0);
        return `${year - 1}`;
    }

    nextFinancialJuly(period: string): string {
        const year = parseInt(period.slice(0, 4), 0);
        return `${year + 1}July`;
    }

    previousFinancialJuly(period: string): string {
        const year = parseInt(period.slice(0, 4), 0);
        return `${year - 1}July`;
    }

    nextQuarter(period: string): string {
        let year = parseInt(period.slice(0, 4), 0);
        let quarter = parseInt(period.slice(5, 6), 0);
        if (quarter === 4) {
            year += 1;
            quarter = 1;
        } else if (quarter < 4) {
            quarter += 1;
        }
        return `${year}Q${quarter}`;
    }

    nextQuarterNov(period: string): string {
        let year = parseInt(period.slice(0, 4), 0);
        let quarter = parseInt(period.slice(8, 9), 0);
        if (quarter === 4) {
            year += 1;
            quarter = 1;
        } else if (quarter < 4) {
            quarter += 1;
        }
        return `${year}NovQ${quarter}`;
    }
    nextFinancialNov(period: string): string {
        let year = parseInt(period.slice(0, 4), 0);
        year += 1;
        return `${year}Nov`;
    }

    nextSixMonth(period: string): string {
        let year = parseInt(period.slice(0, 4), 0);
        let sixMonth = parseInt(period.slice(5, 6), 0);
        if (sixMonth === 2) {
            year += 1;
            sixMonth = 1;
        } else if (sixMonth < 2) {
            sixMonth += 1;
        }
        return `${year}S${sixMonth}`;
    }

    previousQuarter(period: string): string {
        let year = parseInt(period.slice(0, 4), 0);
        let quarter = parseInt(period.slice(5, 6), 0);
        if (quarter === 1) {
            year -= 1;
            quarter = 4;
        } else if (quarter > 1) {
            quarter -= 1;
        }
        return `${year}Q${quarter}`;
    }

    previousQuarterNov(period: string): string {
        let year = parseInt(period.slice(0, 4), 0);
        let quarter = parseInt(period.slice(8, 9), 0);
        if (quarter === 1) {
            year -= 1;
            quarter = 4;
        } else if (quarter > 1) {
            quarter -= 1;
        }
        return `${year}NovQ${quarter}`;
    }

    previousFinancialNov(period: string): string {
        let year = parseInt(period.slice(0, 4), 0);
        year -= 1;
        return `${year}Nov`;
    }

    previousSixMonth(period: string): string {
        let year = parseInt(period.slice(0, 4), 0);
        let sixMonth = parseInt(period.slice(5, 6), 0);
        if (sixMonth === 1) {
            year -= 1;
            sixMonth = 2;
        } else if (sixMonth > 1) {
            sixMonth -= 1;
        }
        return `${year}S${sixMonth}`;
    }

    next(period: string): string {
        if (period.includes('NovQ')) {
            return this.nextQuarterNov(period);
        }
        if (period.includes('Nov')) {
            return this.nextFinancialNov(period);
        }
        if (period.includes('Q')) {
            return this.nextQuarter(period);
        }
        if (period.includes('S')) {
            return this.nextSixMonth(period);
        }
        if (period.length === 6) {
            return this.nextYearMonth(period);
        }
        if (period.length === 4) {
            return this.nextYear(period);
        }
        if (period.includes('July')) {
            return this.nextFinancialJuly(period);
        }

        throw new Error(`unsupported period format ${period}`);
    }

    previous(period: string): string {
        if (period.includes('NovQ')) {
            return this.previousQuarterNov(period);
        }
        if (period.includes('Nov')) {
            return this.previousFinancialNov(period);
        }
        if (period.includes('Q')) {
            return this.previousQuarter(period);
        }
        if (period.includes('S')) {
            return this.previousSixMonth(period);
        }
        if (period.length === 6) {
            return this.previousYearMonth(period);
        }
        if (period.length === 4) {
            return this.previousYear(period);
        }
        if (period.includes('July')) {
            return this.previousFinancialJuly(period);
        }

        throw new Error(`unsupported period format ${period}`);
    }

    previousPeriods(numberOfPeriods: number): string[] {
        let previous = '';
        const previousPeriods: string[] = [];
        let tempPeriodString = this.periodString;

        for (let i = 0; i < numberOfPeriods; i += 1) {
            if (i > 0) {
                tempPeriodString = previousPeriods[i - 1];
            }
            previous = this.previous(tempPeriodString);
            previousPeriods.push(previous);
        }
        return previousPeriods.reverse();
    }

    nextPeriods(numberOfPeriods: number): string[] {
        let next = '';
        const nextPeriods: string[] = [];
        let tempPeriodString = this.periodString;

        for (let i = 0; i < numberOfPeriods; i += 1) {
            if (i > 0) {
                tempPeriodString = nextPeriods[i - 1];
            }
            next = this.next(tempPeriodString);
            nextPeriods.push(next);
        }
        return nextPeriods;
    }
}
