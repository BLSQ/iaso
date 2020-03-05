import _ from 'lodash/fp';

export const PERIOD_TYPE_YEAR = 'YEAR';
export const PERIOD_TYPE_SIX_MONTH = 'SIX_MONTH';
export const PERIOD_TYPE_QUARTER = 'QUARTER';
export const PERIOD_TYPE_MONTH = 'MONTH';

export const PERIOD_TYPES = [
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_SIX_MONTH,
    PERIOD_TYPE_YEAR,
];

export default class Period {
    constructor(periodString) {
        const [periodType, periodParts] = Period.parse(periodString);

        this.periodType = periodType;
        this.month = periodParts.month;
        this.quarter = periodParts.quarter;
        this.semester = periodParts.semester;
        this.year = periodParts.year;
        this.periodString = periodString;
    }

    asPeriodType(periodType) {
        return new Period(this.asPeriodTypeString(periodType));
    }

    asPeriodTypeString(periodType) {
        switch (periodType) {
            case PERIOD_TYPE_MONTH:
                return `${this.year}${String(this.month).padStart(2, '0')}`;
            case PERIOD_TYPE_QUARTER:
                return `${this.year}Q${this.quarter}`;
            case PERIOD_TYPE_SIX_MONTH:
                return `${this.year}S${this.semester}`;
            case PERIOD_TYPE_YEAR:
                return `${this.year}`;
            default:
                throw new Error(`Invalid period type ${periodType}`);
        }
    }

    get monthRange() {
        switch (this.periodType) {
            case PERIOD_TYPE_MONTH:
                return [this.month];
            case PERIOD_TYPE_QUARTER:
                return _.range(this.month - 2, this.month + 1);
            case PERIOD_TYPE_SIX_MONTH:
                return _.range(this.month - 5, this.month + 1);
            case PERIOD_TYPE_YEAR:
                return _.range(this.month - 11, this.month + 1);
            default:
                throw new Error(`Invalid period type ${this.periodType}`);
        }
    }

    static parse(periodString) {
        if (periodString.includes('Q')) {
            return [PERIOD_TYPE_QUARTER, Period.parseQuarterString(periodString)];
        }
        if (periodString.includes('S')) {
            return [PERIOD_TYPE_SIX_MONTH, Period.parseSemesterString(periodString)];
        }
        if (periodString.length === 6) {
            return [PERIOD_TYPE_MONTH, Period.parseMonthString(periodString)];
        }
        if (periodString.length === 4) {
            return [PERIOD_TYPE_YEAR, Period.parseYearString(periodString)];
        }

        throw new Error(`Invalid period string ${periodString}`);
    }

    static parseQuarterString(quarterString) {
        const [year, quarter] = quarterString.split('Q').map(Number);

        return {
            month: quarter * 3,
            quarter,
            semester: Math.ceil(quarter / 2),
            year,
        };
    }

    static parseSemesterString(semesterString) {
        const [year, semester] = semesterString.split('S').map(Number);

        return {
            month: semester * 6,
            quarter: semester * 2,
            semester,
            year,
        };
    }

    static parseMonthString(monthString) {
        const year = Number(monthString.slice(0, 4));
        const month = Number(monthString.slice(4, 6));

        return {
            month,
            quarter: Math.ceil(month / 3),
            semester: Math.ceil(month / 6),
            year,
        };
    }

    static parseYearString(yearString) {
        const year = Number(yearString);

        return {
            month: 12,
            quarter: 4,
            semester: 2,
            year,
        };
    }
}
