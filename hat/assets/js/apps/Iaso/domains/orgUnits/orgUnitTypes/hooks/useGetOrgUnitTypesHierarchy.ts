import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

export type OrgUnitTypeHierarchy = {
    id: number;
    name: string;
    short_name: string;
    depth: number;
    category: string;
    sub_unit_types: OrgUnitTypeHierarchy[];
};

export const useGetOrgUnitTypesHierarchy = (
    orgUnitTypeId: number,
): UseQueryResult<OrgUnitTypeHierarchy, Error> => {
    const queryKey: any[] = ['orgUnitTypeHierarchy', orgUnitTypeId];
    return useSnackQuery({
        queryKey,
        queryFn: () =>
            getRequest(`/api/v2/orgunittypes/${orgUnitTypeId}/hierarchy/`),
        options: {
            enabled: Boolean(orgUnitTypeId),
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: 60000,
            retry: false,
        },
    });
};
