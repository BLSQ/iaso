import { UseQueryResult } from 'react-query';

import { Pagination } from 'bluesquare-components';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { OrgUnit } from '../../types/orgUnit';
import { Search } from '../../types/search';

import { ApiParams } from '../useGetApiParams';

import { Locations } from '../../components/OrgUnitsMap';

import { mapOrgUnitByLocation } from '../../utils';

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
    resetPageToOne: string;
};

type PropsLocation = {
    params: ApiParams;
    searches: Search[];
    isSearchActive: boolean;
    enabled?: boolean;
    resetPageToOne: string;
};

export const useGetOrgUnits = ({
    params,
    isSearchActive,
    callback = () => null,
    enabled = false,
    resetPageToOne,
}: Props): UseQueryResult<Result, Error> => {
    const onSuccess = () => callback();
    const queryString = new URLSearchParams(params);
    return useSnackQuery({
        queryKey: ['orgunits', resetPageToOne],
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
    resetPageToOne,
}: PropsLocation): UseQueryResult<Locations | undefined, Error> => {
    const queryString = new URLSearchParams(params);
    return useSnackQuery({
        queryKey: ['orgunitslocations', resetPageToOne],
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
