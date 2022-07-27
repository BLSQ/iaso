import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { OrgUnit } from '../../types/orgUnit';
import { Search } from '../../types/search';

import { ApiParams } from '../useGetApiParams';

import { Pagination } from '../../../../types/table';
import { Locations } from '../../components/OrgUnitsMap';

import { mapOrgUnitByLocation } from '../../utils';

type Count = {
    index: number;
    count: number;
};
type Result = Pagination & {
    orgunits: OrgUnit[];
    counts: Count[];
};

type Props = {
    params: ApiParams;
    callback?: () => void;
};

type PropsLocation = {
    params: ApiParams;
    searches: Search[];
};

export const useGetOrgUnits = ({
    params,
    callback = () => null,
}: Props): UseQueryResult<Result, Error> => {
    const onSuccess = () => callback();
    const queryString = new URLSearchParams(params);
    return useSnackQuery({
        queryKey: ['orgunits'],
        queryFn: () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        options: {
            enabled: false,
            staleTime: Infinity,
            onSuccess,
        },
    });
};

export const useGetOrgUnitsLocations = ({
    params,
    searches,
}: PropsLocation): UseQueryResult<Locations, Error> => {
    const queryString = new URLSearchParams(params);
    return useSnackQuery({
        queryKey: ['orgunitslocations'],
        queryFn: () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        options: {
            enabled: false,
            staleTime: Infinity,
            select: data => mapOrgUnitByLocation(data, searches),
        },
    });
};
