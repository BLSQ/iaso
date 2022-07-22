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
    enabled: boolean;
    callback?: () => void;
};

type PropsLocation = {
    params: ApiParams;
    enabled: boolean;
    searches: Search[];
};

export const useGetOrgUnits = ({
    params,
    enabled,
    callback = () => null,
}: Props): UseQueryResult<Result, Error> => {
    const onSuccess = () => callback();
    const queryString = new URLSearchParams(params);
    return useSnackQuery({
        queryKey: ['orgunits'],
        queryFn: () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        options: {
            enabled,
            onSuccess,
        },
    });
};

export const useGetOrgUnitsLocations = ({
    params,
    enabled,
    searches,
}: PropsLocation): UseQueryResult<Locations, Error> => {
    const queryString = new URLSearchParams(params);
    return useSnackQuery({
        queryKey: ['orgunitslocations'],
        queryFn: () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        options: {
            enabled,
            select: data => mapOrgUnitByLocation(data, searches),
        },
    });
};
