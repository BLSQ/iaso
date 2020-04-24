import range from 'lodash/fp/range';
import {
    PERIOD_TYPE_MONTH, PERIOD_TYPE_QUARTER, PERIOD_TYPE_SIX_MONTH, PERIOD_TYPE_YEAR,
} from './constants';
import { textPlaceholder } from '../../constants/uiConstants';

export class Period {
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
        let periodTypeString;
        switch (periodType) {
            case PERIOD_TYPE_MONTH:
                periodTypeString = `${this.year}${String(this.month).padStart(2, '0')}`;
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
            default:
                throw new Error(`Invalid period type ${periodType}`);
        }

        return new Period(periodTypeString);
    }

    get monthRange() {
        switch (this.periodType) {
            case PERIOD_TYPE_MONTH:
                return [this.month];
            case PERIOD_TYPE_QUARTER:
                return range(this.month - 2, this.month + 1);
            case PERIOD_TYPE_SIX_MONTH:
                return range(this.month - 5, this.month + 1);
            case PERIOD_TYPE_YEAR:
                return range(this.month - 11, this.month + 1);
            default:
                throw new Error(`Invalid period type ${this.periodType}`);
        }
    }

    toCode() {
        switch (this.periodType) {
            case PERIOD_TYPE_MONTH:
                return `${String(this.month).padStart(2, '0')}/${this.year}`;
            case PERIOD_TYPE_QUARTER:
                return `Q${this.quarter}/${this.year}`;
            case PERIOD_TYPE_SIX_MONTH:
                return `S${this.semester}/${this.year}`;
            case PERIOD_TYPE_YEAR:
                return `${this.year}`;
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

    static getPrettyPeriod(period) {
        if (!period) return textPlaceholder;
        if (period.length === 4) {
            return period;
        }
        const year = period.substring(0, 4);
        const prefix = period.substring(4, 6);
        return `${prefix}-${year}`;
    }
}
