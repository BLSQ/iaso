import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import { Period } from './models.ts';
import {
    PERIOD_TYPE_DAY,
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_QUARTER_NOV,
    PERIOD_TYPE_SIX_MONTH,
    PERIOD_TYPE_FINANCIAL_NOV,
    QUARTERS,
    QUARTERS_NOV,
    SEMESTERS,
    MONTHS,
    PERIOD_TYPE_WEEK,
} from './constants';
import MESSAGES from './messages';

import {
    hasFeatureFlag,
    HIDE_PERIOD_QUARTER_NAME,
} from '../../utils/featureFlags';
import { useCurrentUser } from '../../utils/usersUtils.ts';
import moment from 'moment';
import { getLocaleDateFormat } from '../../utils/dates.ts';

export const getDefaultPeriodString = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = Period.padMonth(new Date().getMonth() + 1);
    return `${currentYear}${currentMonth}`;
};

export const getDefaultPeriod = () => new Period(getDefaultPeriodString());

export const isValidPeriod = (pString: any, periodType: any = PERIOD_TYPE_DAY) => {
    if (!pString) {
        return true;
    }
    const pType = Period.getPeriodType(pString);
    return Boolean(pType && pType === periodType);
};

export const errorTypes = {
    invalid: {
        message: MESSAGES.invalidPeriodError,
        key: 'invalid',
    },
    chronological: {
        message: MESSAGES.chronologicalPeriodError,
        key: 'chronological',
    },
};

export const getPeriodsErrors = (startPeriod: any, endPeriod: any, pType: any) => {
    let errors = {
        start: null,
        end: null,
    };
    const isStartValid = isValidPeriod(startPeriod, pType);
    if (!isStartValid) {
        errors = {
            ...errors,
            start: {
                [errorTypes.invalid.key]: true,
            },
        };
    }
    const isEndValid = isValidPeriod(endPeriod, pType);
    if (!isEndValid) {
        errors = {
            ...errors,
            end: {
                [errorTypes.invalid.key]: true,
            },
        };
    }
    if (startPeriod && isStartValid && endPeriod && isEndValid) {
        const isStartBeforeEnd = Period.isBefore(startPeriod, endPeriod);
        if (!isStartBeforeEnd) {
            errors = {
                start: {
                    [errorTypes.chronological.key]: true,
                },
                end: {
                    [errorTypes.chronological.key]: true,
                },
            };
        }
    }

    return errors;
};

export const getPeriodPickerString = (periodType: any, period: any, value: any) => {
    if (!period) {
        return '';
    }
    switch (periodType) {
        case PERIOD_TYPE_FINANCIAL_NOV: {
            return period.year ? `${period.year}Nov` : null;
        }
        case PERIOD_TYPE_WEEK: {
            return period.year ? `${period.year}W${period.week}` : null;;
        }
        case PERIOD_TYPE_DAY: {
            return value;
        }
        case PERIOD_TYPE_MONTH: {
            const { year } = period;
            const month = period.month ? Period.padMonth(period.month) : null;
            return !year && !month
                ? null
                : `${period.year || ''}${month || ''}`;
        }
        case PERIOD_TYPE_QUARTER: {
            const { year } = period;
            const quarter = period.quarter ? QUARTERS[period.quarter] : null;
            return !year && !quarter
                ? null
                : `${period.year || ''}${quarter || ''}`;
        }
        case PERIOD_TYPE_QUARTER_NOV: {
            const { year } = period;
            const quarter = period.quarter ? QUARTERS_NOV[period.quarter] : null;
            return !year && !quarter
                ? null
                : `${period.year || ''}${quarter || ''}`;
        }
        case PERIOD_TYPE_SIX_MONTH: {
            const { year } = period;
            const semester = period.semester
                ? SEMESTERS[period.semester]
                : null;
            return !year && !semester
                ? null
                : `${period.year || ''}${semester || ''}`;
        }
        default:
            return period.year ? `${period.year}` : null;
    }
};

const getMonthRangeString = (monthRange: any, formatMessage: any) => {
    if (monthRange.length === 1) {
        return formatMessage(MONTHS[monthRange[0]]);
    }
    const firstMonth = MONTHS[monthRange[0]];
    const lastMonth = MONTHS[monthRange[monthRange.length - 1]];
    return `${formatMessage(firstMonth)} - ${formatMessage(lastMonth)}`;
};

export function getISOWeekDates(isoWeekStr: string) {
    const [year, week] = isoWeekStr.split("W").map(Number);

    const jan4 = new Date(Date.UTC(year, 0, 4));
    const jan4Day = jan4.getUTCDay() || 7;

    const monday = new Date(jan4);
    monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1) + (week - 1) * 7);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    return { start: monday, end: sunday };
}

export function getWeekDisplayedRange(isoWeekStr: string) {
    // the string can be invalid in various ways, so we check and return null in that case, 
    // called at various time when user is editing the week field (missing parts year without week, etc)
    if (isoWeekStr == undefined || isoWeekStr == "" || isoWeekStr.includes("undefined") || isoWeekStr.includes("null")) {
        return null
    }
    const weekDates = getISOWeekDates(isoWeekStr);
    const start = formatDate(weekDates.start)
    const end = formatDate(weekDates.end)
    return `${start} - ${end}`
}

export function getNumberOfIsoWeeksInYear(year: number): number {
    const d = new Date(Date.UTC(year, 11, 28));
    return getISOWeek(d);
}

function formatDate(date: Date): string {
    return moment(date).format(getLocaleDateFormat('L'));
}


function getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export const getPrettyPeriod = (period: string, formatMessage: any, currentUser: any) => {
    if (!period) return textPlaceholder;
    const periodClass = new Period(period);

    const prettyPeriod = `${period.substring(4, 6)}-${periodClass.year}`;
    switch (periodClass.periodType) {
        case PERIOD_TYPE_WEEK: {
            const weekDates = getISOWeekDates(period);
            const start = formatDate(weekDates.start)
            const end = formatDate(weekDates.end)
            // will return something like : Semaine N° 6 (08/02/2021 - 14/02/2021)
            return formatMessage(MESSAGES.weekDisplay, { weekNumber: periodClass.week, start, end });
        }
        case PERIOD_TYPE_DAY: {
            return `${periodClass.year}-${periodClass.month}-${periodClass.day}`;
        }
        case PERIOD_TYPE_MONTH:
        case PERIOD_TYPE_SIX_MONTH: {
            const monthRangeString = getMonthRangeString(
                periodClass.monthRange,
                formatMessage,
            );
            return `${prettyPeriod} (${monthRangeString})`;
        }
        case PERIOD_TYPE_QUARTER_NOV: {
            const monthRangeString = getMonthRangeString(
                periodClass.monthRange,
                formatMessage,
            );
            return `${period} (${monthRangeString})`;
        }
        case PERIOD_TYPE_QUARTER: {
            const monthRangeString = getMonthRangeString(
                periodClass.monthRange,
                formatMessage,
            );
            if (hasFeatureFlag(currentUser, HIDE_PERIOD_QUARTER_NAME)) {
                return `${monthRangeString} ${periodClass.year}`;
            }
            return `${prettyPeriod} (${monthRangeString})`;
        }
        default:
            return period;
    }
};

export const usePrettyPeriod = () => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    return period => getPrettyPeriod(period, formatMessage, currentUser);
};
