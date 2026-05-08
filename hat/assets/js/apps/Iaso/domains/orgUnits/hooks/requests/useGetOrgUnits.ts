import { UseQueryResult } from 'react-query';

import { createSearchParamsWithArray } from 'Iaso/libs/utils';
import { Pagination } from 'Iaso/types/general';
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

export const DEFAULT_ORG_UNIT_COLUMNS = [
    'id',
    'projects',
    'name',
    'org_unit_type_name',
    'source',
    'validation_status',
    'created_at',
    'updated_at',
    'actions',
    // those 4 are required to display tha map icon in the table row and link directly to the map tab details pages
    'has_geo_json',
    'latitude',
    'longitude',
    'altitude',
];

export const NON_SELECTABLE_COLUMNS = ['actions', 'selection'];

const getCleanFields = (fields?: string | string[]): string | undefined => {
    const fieldsArray = Array.isArray(fields)
        ? fields
        : (fields?.split(',') ?? DEFAULT_ORG_UNIT_COLUMNS);

    const filtered = fieldsArray.filter(
        f => f && !NON_SELECTABLE_COLUMNS.includes(f),
    );

    return filtered.length > 0 ? filtered.join(',') : undefined;
};

type Props = {
    params: ApiParams;
    callback?: () => void;
};

type PropsLocation = {
    params: ApiParams;
    searches: Search[];
    enabled?: boolean;
};

export const useGetOrgUnits = ({
    params,
    callback = () => null,
}: Props): UseQueryResult<Result, Error> => {
    const onSuccess = () => callback();
    const apiParams: ApiParams = {
        ...params,
        fields: getCleanFields(params.fields),
    };
    const queryString = createSearchParamsWithArray(apiParams);
    return useSnackQuery({
        queryKey: ['orgunits', apiParams],
        queryFn: () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        options: {
            staleTime: Infinity,
            keepPreviousData: true,
            onSuccess,
        },
    });
};

export const useGetOrgUnitsLocations = ({
    params,
    searches,
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
                if (data) {
                    return mapOrgUnitByLocation(data, searches);
                }
                return undefined;
            },
        },
    });
};
