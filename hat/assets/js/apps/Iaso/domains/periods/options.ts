import { useCallback, useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { getYears } from 'Iaso/utils';
import {
    hasFeatureFlag,
    HIDE_PERIOD_QUARTER_NAME,
} from 'Iaso/utils/featureFlags';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import {
    MONTHS,
    PERIOD_TYPE_QUARTER_NOV,
    QUARTERS,
    QUARTERS_NOV_RANGE,
    QUARTERS_RANGE,
    SEMESTERS,
    SEMESTERS_RANGE,
} from './constants';
import { PeriodObject } from './models';
import { getNumberOfIsoWeeksInYear, getWeekDisplayedRange } from './utils';

const yearOptions = () => {
    return getYears(20, 10, true).map(y => ({
        label: y.toString(),
        value: y.toString(),
    }));
};

export const usePeriodPickerOptions = (
    periodType: string | Record<string, string>,
    currentPeriod: Partial<PeriodObject> | null,
) => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const getQuarterOptionLabel = useCallback(
        (value, label) => {
            if (periodType === PERIOD_TYPE_QUARTER_NOV) {
                return `${label} (${formatMessage(
                    QUARTERS_NOV_RANGE[value][0],
                )}-${formatMessage(QUARTERS_NOV_RANGE[value][1])})`;
            }

            if (hasFeatureFlag(currentUser, HIDE_PERIOD_QUARTER_NAME)) {
                return `${formatMessage(QUARTERS_RANGE[value][0])}-${formatMessage(
                    QUARTERS_RANGE[value][1],
                )}`;
            }
            return `${label} (${formatMessage(
                QUARTERS_RANGE[value][0],
            )}-${formatMessage(QUARTERS_RANGE[value][1])})`;
        },
        [formatMessage, periodType, currentUser],
    );
    const weekOptions = useMemo(() => {
        if (!currentPeriod?.year) {
            return [];
        }
        const length = getNumberOfIsoWeeksInYear(currentPeriod?.year ?? 0);
        const getOption = (_, i) => ({
            label: `${i + 1} (${getWeekDisplayedRange(`${currentPeriod?.year}W${i + 1}`)})`,
            value: i + 1,
        });
        return Array.from(
            {
                length,
            },
            getOption,
        );
    }, [currentPeriod?.year]);
    const semesterOptions = useMemo(() => {
        return Object.entries(SEMESTERS).map(([value, label]) => ({
            label: `${label} (${formatMessage(
                SEMESTERS_RANGE[value][0],
            )}-${formatMessage(SEMESTERS_RANGE[value][1])})`,
            value,
        }));
    }, [formatMessage]);
    const quarterOptions = useMemo(() => {
        return Object.entries(QUARTERS).map(([value, label]) => ({
            label: getQuarterOptionLabel(value, label),
            value,
        }));
    }, [getQuarterOptionLabel]);
    const monthOptions = useMemo(() => {
        return Object.entries(MONTHS).map(([value, month]) => ({
            label: formatMessage(month),
            value,
        }));
    }, [formatMessage]);

    return {
        semesterOptions,
        quarterOptions,
        monthOptions,
        yearOptions,
        weekOptions,
    };
};
