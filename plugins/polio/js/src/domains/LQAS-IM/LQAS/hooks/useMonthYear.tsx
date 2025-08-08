import { useMemo } from 'react';
import moment from 'moment';
import { MonthYear, Side } from '../../../../constants/types';

export type UseMonthYearArgs = {
    side: Side;
    params: Record<string, string>;
};

export const useMonthYear = ({
    side,
    params,
}: UseMonthYearArgs): MonthYear | undefined => {
    return useMemo(() => {
        const currentYear = moment().year().toString();
        const month = params[`${side}Month`];
        const year = params[`${side}Year`] ?? currentYear;

        if (month) return `${month}-${year}`;
        return undefined;
    }, [side, ...Object.values(params)]);
};
