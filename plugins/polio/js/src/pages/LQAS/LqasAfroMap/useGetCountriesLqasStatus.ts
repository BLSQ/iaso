import { useMemo } from 'react';
import { UseQueryResult, useQueries } from 'react-query';
import { getRequest } from '../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { LqasImData } from '../../../constants/types';
import { determineStatusForDistrict } from '../utils';
import { useSnackQueries } from '../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import {
    IN_SCOPE,
    LQAS_DISQUALIFIED,
    LQAS_FAIL,
    LQAS_PASS,
} from '../../IM/constants';

type UseGetCountriesLqasStatusParams = {
    countries?: any[];
    round?: 'latest' | string;
};
const calculateCountryStatus = (passed: number, total: number) => {
    const ratio = Math.round((passed * 100) / total);
    if (ratio >= 80) return LQAS_PASS;
    if (ratio >= 50) return LQAS_DISQUALIFIED;
    return LQAS_FAIL;
};

const calculateStatus = (country, allLqasData, round = 'latest') => {
    const lqasDataForCountry = allLqasData.find(
        lqasData => lqasData?.data?.id === country.id,
    );
    if (!lqasDataForCountry) {
        return IN_SCOPE;
    }
    if (!lqasDataForCountry?.data) {
        return IN_SCOPE;
    }
    const { stats } = lqasDataForCountry.data;
    // TODO enable tracking of campaign by date for calendar view
    const latestCampaign: any = Object.values(stats)[0];
    // TODO check date for latest round: don't pick future round or round where lqas not over
    const dataForRound =
        round === 'latest'
            ? latestCampaign?.rounds?.[latestCampaign.rounds.length - 1]?.data
            : latestCampaign?.rounds?.find(r => `${r.number}` === round)?.data;
    if (!dataForRound) {
        return IN_SCOPE;
    }
    const statuses = Object.values(dataForRound ?? {})
        .map((districtData: any) => {
            return {
                status: determineStatusForDistrict(districtData) ?? '',
            };
        })
        .reduce(
            (
                total: any,
                current: {
                    status: string;
                },
            ) => {
                const next = { ...total };
                if (!next.passed) {
                    next.passed = 0;
                }
                if (!next.total) {
                    next.total = 0;
                }
                if (parseInt(current.status, 10) === 1) {
                    next.passed += 1;
                }
                next.total += 1;
                return next;
            },
            {},
        );

    const status =
        statuses.total > 0
            ? calculateCountryStatus(statuses.passed, statuses.total)
            : IN_SCOPE;
    return status;
};

export const useGetCountriesLqasStatus = ({
    countries,
    round = 'latest',
}: UseGetCountriesLqasStatusParams): any => {
    const queries = useMemo(() => {
        if (!countries) return [];
        return countries.map(country => {
            return {
                queryKey: [`country-lqas-${country.id}`],
                queryFn: () => getRequest(`/api/datastore/lqas_${country.id}`),
                options: {
                    enabled: Boolean(countries),
                    select: data => {
                        if (!data) return { data: null, id: country.id };
                        return { ...data.data, id: country.id };
                    },
                    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
                    onError: error => null,
                },
                dispatchOnError: false,
            };
        });
    }, [countries]);

    // TODO make api endpoint to avoid all these calls
    const allLqasData = useSnackQueries(queries);
    const isFetching = allLqasData.some(query => query.isFetching);
    const countriesWithStatus = useMemo(() => {
        if (isFetching) return countries;
        return (
            countries?.map(country => {
                return {
                    ...country,
                    status: calculateStatus(country, allLqasData, round),
                };
            }) ?? []
        );
    }, [allLqasData, countries, isFetching, round]);
    const isFetchingOrComputing =
        isFetching || countriesWithStatus!.length === 0;

    return useMemo(
        () => ({ isFetching: isFetchingOrComputing, countriesWithStatus }),
        [countriesWithStatus, isFetchingOrComputing],
    );
};
