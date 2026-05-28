import { UseQueryResult } from 'react-query';
import { PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

export type ParentOrgUnit = PlanningOrgUnits & {
    org_unit_type_name: string;
    has_geo_json: boolean;
    parent_id: number;
    parent_name: string;
    org_unit_type: string;
    org_unit_type_depth: number;
    source_id: number;
    source_name: string;
};

type Props = {
    orgUniParentId?: number;
    orgUnitTypeIds?: number[];
};

type ApiParams = {
    limit: string;
    validation_status: string;
    asLocation: string;
    orgUnitParentId?: string;
    orgUnitTypeId?: string;
};

export const useGetParentOrgUnits = ({
    orgUniParentId,
    orgUnitTypeIds,
}: Props): UseQueryResult<ParentOrgUnit[], Error> => {
    const apiParams: ApiParams = {
        limit: '10000',
        validation_status: 'VALID',
        asLocation: 'true',
        orgUnitParentId: orgUniParentId ? `${orgUniParentId}` : undefined,
        orgUnitTypeId: orgUnitTypeIds?.join(',') || undefined,
    };
    const queryString = new URLSearchParams(apiParams).toString();
    return useSnackQuery({
        queryKey: ['assignments-parent-org-units', queryString],
        queryFn: () => getRequest(`/api/orgunits/?${queryString}`),
        options: {
            staleTime: Infinity,
            keepPreviousData: true,
            enabled: Boolean(orgUniParentId && orgUnitTypeIds),
            select: data => data?.orgUnits || [],
        },
    });
};
