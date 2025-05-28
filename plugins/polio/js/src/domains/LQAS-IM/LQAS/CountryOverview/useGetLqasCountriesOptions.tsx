import { UseQueryResult } from 'react-query';
import { LqasUrlParams } from '../lqas';
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

const getLqasCountriesOptions = (monthYear?: MonthYear) => {
    const endpoint = '/api/polio/lqasim/countriesoptions';
    return getRequest(`${endpoint}/?month=${monthYear}`);
};

type UseGetLqasCountriesOptionsArgs = {
    side: Side;
    params: LqasUrlParams;
};

const useMonthYear = ({
    side,
    params,
}: UseGetLqasCountriesOptionsArgs): MonthYear | undefined => {
    return useMemo(() => {
        const currentYear = moment().year().toString();
        const month = params[`${side}Month`];
        const year = params[`${side}Year`] ?? currentYear;

        if (month) return `${month}-${year}`;
        return undefined;
    }, [side, ...Object.values(params)]);
};

export const useGetLqasCountriesOptions = ({
    side,
    params,
}: UseGetLqasCountriesOptionsArgs): UseQueryResult<
    DropdownOptions<number>[]
> => {
    const monthYear: MonthYear | undefined = useMonthYear({ side, params });
    return useSnackQuery({
        queryKey: ['lqasCountries', monthYear],
        queryFn: () => getLqasCountriesOptions(monthYear),
        options: {
            enabled: Boolean(monthYear),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
            select: data => data?.results ?? [],
        },
    });
};
const getLqasCampaignsOptions = (
    monthYear?: MonthYear,
    country?: NumberAsString,
) => {
    const endpoint = '/api/polio/lqasim/campaignoptions';
    return getRequest(`${endpoint}/?month=${monthYear}&country_id=${country}`);
};

type UseGetLqasCampaignsOptionsArgs = UseGetLqasCountriesOptionsArgs;

export const useGetLqasCampaignsOptions = ({
    side,
    params,
}: UseGetLqasCampaignsOptionsArgs): UseQueryResult<
    DropdownOptions<UuidAsString>[]
> => {
    const monthYear: MonthYear | undefined = useMonthYear({ side, params });
    const country = params[`${side}Country`];
    return useSnackQuery({
        queryKey: ['lqasCampaigns', monthYear, country],
        queryFn: () => getLqasCampaignsOptions(monthYear, country),
        options: {
            enabled: Boolean(monthYear) && Boolean(country),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
            select: data => data?.results ?? [],
        },
    });
};
const getLqasRoundOptions = (
    monthYear?: MonthYear,
    campaign?: UuidAsString,
) => {
    const endpoint = '/api/polio/lqasim/roundoptions';
    return getRequest(
        `${endpoint}/?month=${monthYear}&campaign_id=${campaign}`,
    );
};

type UseGetLqasRoundOptionsArgs = UseGetLqasCountriesOptionsArgs;

export const useGetLqasRoundOptions = ({
    side,
    params,
}: UseGetLqasRoundOptionsArgs): UseQueryResult<
    DropdownOptions<NumberAsString>[]
> => {
    const monthYear: MonthYear | undefined = useMonthYear({ side, params });
    const campaign = params[`${side}Campaign`];
    return useSnackQuery({
        queryKey: ['lqasRounds', monthYear, campaign],
        queryFn: () => getLqasRoundOptions(monthYear, campaign),
        options: {
            enabled: Boolean(monthYear) && Boolean(campaign),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
            select: data => data?.results ?? [],
        },
    });
};
