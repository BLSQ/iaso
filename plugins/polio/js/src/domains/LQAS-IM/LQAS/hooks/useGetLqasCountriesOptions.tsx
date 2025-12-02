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
import { appId } from '../../../../constants/app';

const getLqasCountriesOptions = (monthYear?: MonthYear, isEmbedded = false) => {
    const endpoint = '/api/polio/lqasim/countriesoptions';
    const url = `${endpoint}/?month=${monthYear}`;
    if (isEmbedded) {
        return getRequest(`${url}&app_id=${appId}`);
    }
    return getRequest(url);
};

type UseGetLqasCountriesOptionsArgs = {
    side: Side;
    params: LqasUrlParams;
    isEmbedded?: boolean;
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
    isEmbedded = false,
}: UseGetLqasCountriesOptionsArgs): UseQueryResult<
    DropdownOptions<number>[]
> => {
    const monthYear: MonthYear | undefined = useMonthYear({ side, params });
    return useSnackQuery({
        queryKey: ['lqasCountries', monthYear], // not including isEmbedded to the queryKey since it has no impact on the result
        queryFn: () => getLqasCountriesOptions(monthYear, isEmbedded),
        options: {
            enabled: Boolean(monthYear),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: false,
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
            keepPreviousData: false,
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
            keepPreviousData: false,
            select: data => data?.results ?? [],
        },
    });
};
