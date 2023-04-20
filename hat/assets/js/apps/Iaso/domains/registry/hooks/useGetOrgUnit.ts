import { UseQueryResult } from 'react-query';

import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';
import { makeUrlWithParams } from '../../../libs/utils';

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

type Result = {
    orgUnits: OrgUnit[];
};

export const useGetOrgUnitsChildren = (
    orgUnitParentId: string,
    orgUnitTypes: OrgunitTypes,
): UseQueryResult<OrgUnit[], Error> => {
    const params: Record<string, any> = {
        validation_status: 'VALID',
        orgUnitParentId,
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
