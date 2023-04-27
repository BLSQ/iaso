import { UseQueryResult } from 'react-query';

import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';
import { makeUrlWithParams } from '../../../libs/utils';
import { RegistryDetailParams } from '../types';
import { Pagination } from '../../../types/table';

export const useGetOrgUnit = (
    orgUnitId: string,
): UseQueryResult<OrgUnit, Error> => {
    const queryKey: any[] = ['orgUnit', orgUnitId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest(`/api/orgunits/${orgUnitId}/`),
        options: {
            retry: false,
        },
    });
};

type ResultList = Pagination & {
    orgunits: OrgUnit[];
};

export const useGetOrgUnitsListChildren = (
    orgUnitParentId: string,
    orgUnitTypes: OrgunitTypes,
    params: RegistryDetailParams,
): UseQueryResult<ResultList, Error> => {
    let order = '-name';
    if (params.orgUnitListOrder) {
        if (params.orgUnitListOrder === 'location') {
            order = 'location,simplified_geom';
        } else if (params.orgUnitListOrder === '-location') {
            order = '-location,-simplified_geom';
        } else {
            order = params.orgUnitListOrder;
        }
    }
    const apiParams: Record<string, any> = {
        validation_status: 'VALID',
        orgUnitParentId,
        onlyDirectChildren: true,
        limit: params.orgUnitListPageSize || '10',
        order,
        page: params.orgUnitListPage || '1',
    };
    if (orgUnitTypes?.length > 0) {
        apiParams.orgUnitTypeId = orgUnitTypes
            .map(orgunitType => orgunitType.id)
            .join(',');
    }

    const url = makeUrlWithParams('/api/orgunits/', apiParams);
    return useSnackQuery({
        queryKey: ['orgUnits', apiParams],
        queryFn: () => getRequest(url),
        options: {
            keepPreviousData: true,
            select: data => {
                if (!data) return undefined;
                const orgunits: OrgUnit[] = data.orgunits.filter(
                    orgUnit => `${orgUnitParentId}` !== `${orgUnit.id}`,
                );
                return {
                    ...data,
                    orgunits,
                };
            },
        },
    });
};

type Result = {
    orgUnits: OrgUnit[];
};
export const useGetOrgUnitsMapChildren = (
    orgUnitParentId: string,
    orgUnitTypes: OrgunitTypes,
): UseQueryResult<OrgUnit[], Error> => {
    const params: Record<string, any> = {
        validation_status: 'VALID',
        orgUnitParentId,
        withShapes: true,
        onlyDirectChildren: true,
    };

    const url = makeUrlWithParams('/api/orgunits/', params);
    return useSnackQuery({
        queryKey: ['orgUnits', params],
        queryFn: () => getRequest(url),
        options: {
            select: (data: Result): OrgUnit[] => {
                if (!data) return [];
                const { orgUnits } = data;
                // adding this because backend can send children that are not sub org unit types of the parent org unit type
                return orgUnits?.filter(child =>
                    orgUnitTypes.some(
                        subType => subType.id === child.org_unit_type_id,
                    ),
                );
            },
        },
    });
};
