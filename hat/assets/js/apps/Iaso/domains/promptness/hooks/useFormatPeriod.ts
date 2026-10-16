import { useCallback } from 'react';
import moment from 'moment';
import { PERIOD_TYPE_MONTH } from '../../periods/constants';
import { Period } from '../../periods/models';
import { usePrettyPeriod } from '../../periods/utils';

// "September 2026" for a month, the usual pretty period for the other types
export const useFormatPeriod = (): ((period?: string) => string) => {
    const formatPrettyPeriod = usePrettyPeriod();
    return useCallback(
        (period?: string) => {
            if (!period) return '';
            if (Period.getPeriodType(period) === PERIOD_TYPE_MONTH) {
                return moment(period, 'YYYYMM').format('MMMM YYYY');
            }
            return formatPrettyPeriod(period);
        },
        [formatPrettyPeriod],
    );
};
