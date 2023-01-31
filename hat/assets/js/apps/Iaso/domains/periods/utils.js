import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import { Period } from './models.ts';
import {
    PERIOD_TYPE_DAY,
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_SIX_MONTH,
    QUARTERS,
    SEMESTERS,
    MONTHS,
} from './constants';
import MESSAGES from './messages';

import {
    hasFeatureFlag,
    HIDE_PERIOD_QUARTER_NAME,
} from '../../utils/featureFlags';
import { useCurrentUser } from '../../utils/usersUtils.ts';

export const getDefaultPeriodString = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = Period.padMonth(new Date().getMonth() + 1);
    return `${currentYear}${currentMonth}`;
};

export const getDefaultPeriod = () => new Period(getDefaultPeriodString());

export const isValidPeriod = (pString, periodType = PERIOD_TYPE_DAY) => {
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

export const getPeriodsErrors = (startPeriod, endPeriod, pType) => {
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

export const getPeriodPickerString = (periodType, period, value) => {
    if (!period) {
        return '';
    }
    switch (periodType) {
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

const getMonthRangeString = (monthRange, formatMessage) => {
    if (monthRange.length === 1) {
        return formatMessage(MONTHS[monthRange[0]]);
    }
    const firstMonth = MONTHS[monthRange[0]];
    const lastMonth = MONTHS[monthRange[monthRange.length - 1]];
    return `${formatMessage(firstMonth)} - ${formatMessage(lastMonth)}`;
};

export const getPrettyPeriod = (period, formatMessage, currentUser) => {
    if (!period) return textPlaceholder;
    const periodClass = new Period(period);

    const prettyPeriod = `${period.substring(4, 6)}-${periodClass.year}`;
    switch (periodClass.periodType) {
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
