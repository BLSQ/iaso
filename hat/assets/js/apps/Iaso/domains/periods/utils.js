import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import { useSelector } from 'react-redux';
import { Period } from './models';
import {
    PERIOD_TYPE_DAY,
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_YEAR,
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

export const getDefaultPeriodString = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = Period.padMonth(new Date().getMonth() + 1);
    return `${currentYear}${currentMonth}`;
};

export const getDefaultPeriod = () => new Period(getDefaultPeriodString());

export const isValidPeriod = (pString, periodType = PERIOD_TYPE_DAY) => {
    if (!pString) return true;
    const pType = Period.getPeriodType(pString);
    if (pType && pType === periodType) {
        return true;
    }
    return false;
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
export const getPrettyPeriod = (period, formatMessage, currentUser) => {
    console.log('getPrettyPeriod', currentUser);
    if (!period) return textPlaceholder;
    const periodClass = new Period(period);
    if (periodClass.periodType === PERIOD_TYPE_YEAR) {
        return period;
    }
    let prefix = `${period.substring(4, 6)}-`;
    if (
        hasFeatureFlag(currentUser, HIDE_PERIOD_QUARTER_NAME) &&
        periodClass.periodType === PERIOD_TYPE_QUARTER
    ) {
        prefix = '';
    }
    const prettyPeriod = `${prefix}${periodClass.year}`;

    let monthRangeString;
    if (
        formatMessage &&
        periodClass.periodType !== PERIOD_TYPE_DAY &&
        periodClass.periodType !== PERIOD_TYPE_MONTH
    ) {
        const { monthRange } = periodClass;
        const firstMonth = MONTHS[monthRange[0]];
        const lastMonth = MONTHS[monthRange[monthRange.length - 1]];
        monthRangeString = ` (${formatMessage(firstMonth)}-${formatMessage(
            lastMonth,
        )})`;
    }
    return `${prettyPeriod}${monthRangeString || ''}`;
};

export const usePrettyPeriod = () => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useSelector(state => state.users.current);
    console.log('usePrettyPeriod', currentUser);
    return period => getPrettyPeriod(period, formatMessage, currentUser);
};
