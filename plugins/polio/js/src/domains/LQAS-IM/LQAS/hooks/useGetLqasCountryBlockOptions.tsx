import { UseQueryResult } from 'react-query';
import { LqasUrlParams } from '..';
import {
    MonthYear,
    NumberAsString,
    Side,
    UuidAsString,
} from '../../../../constants/types';
import { useMemo } from 'react';
import moment from 'moment';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { getRequest } from 'Iaso/libs/Api';
import { DropdownOptions } from 'Iaso/types/utils';
import { useMonthYear } from './useMonthYear';
import { LqasCountryBlockParams } from '../CountryBlockView/LqasCountryBlock';

const getLqasCountryBlockOptions = (monthYear?: MonthYear) => {
    const endpoint = '/api/polio/lqasim/countryblockoptions';
    return getRequest(`${endpoint}/?month=${monthYear}`);
};

type UseGetLqasCountryBlockOptionsArgs = {
    side: Side;
    params: LqasCountryBlockParams;
};

export const useGetLqasCountryBlockOptions = ({
    side,
    params,
}: UseGetLqasCountryBlockOptionsArgs): UseQueryResult<
    DropdownOptions<number>[]
> => {
    const monthYear: MonthYear | undefined = useMonthYear({ side, params });
    return useSnackQuery({
        queryKey: ['lqasCountries', monthYear],
        queryFn: () => getLqasCountryBlockOptions(monthYear),
        options: {
            enabled: Boolean(monthYear),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: false,
            select: data => data?.results ?? [],
        },
    });
};
