import { Pagination } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { Locations } from '../../components/OrgUnitsMap';
import { OrgUnit } from '../../types/orgUnit';
import { Search } from '../../types/search';

import { mapOrgUnitByLocation } from '../../utils';
import { ApiParams } from '../useGetApiParams';

export type Count = {
    index: number;
    count: number;
};
export type Result = Pagination & {
    orgunits: OrgUnit[];
    counts: Count[];
};

type Props = {
    params: ApiParams;
    callback?: () => void;
    isSearchActive: boolean;
    enabled?: boolean;
};

type PropsLocation = {
    params: ApiParams;
    searches: Search[];
    isSearchActive: boolean;
    enabled?: boolean;
};

export const useGetOrgUnits = ({
    params,
    isSearchActive,
    callback = () => null,
    enabled = false,
}: Props): UseQueryResult<Result, Error> => {
    const onSuccess = () => callback();
    const queryString = new URLSearchParams(params);
    return useSnackQuery({
        queryKey: ['orgunits', params],
        queryFn: () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        options: {
            enabled,
            staleTime: Infinity,
            keepPreviousData: true,
            onSuccess,
            select: data => {
                if (isSearchActive) {
                    return data;
                }
                return undefined;
            },
        },
    });
};

export const useGetOrgUnitsLocations = ({
    params,
    searches,
    isSearchActive,
    enabled = false,
}: PropsLocation): UseQueryResult<Locations | undefined, Error> => {
    const queryString = new URLSearchParams(params);
    return useSnackQuery({
        queryKey: ['orgunitslocations', params],
        queryFn: () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        options: {
            enabled,
            staleTime: Infinity,
            select: data => {
                if (isSearchActive) {
                    return mapOrgUnitByLocation(data, searches);
                }
                return undefined;
            },
        },
    });
};
