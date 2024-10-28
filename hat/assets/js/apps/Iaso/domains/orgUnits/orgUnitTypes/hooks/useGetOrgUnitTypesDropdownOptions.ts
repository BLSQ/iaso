import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { DropdownOptions } from '../../../../types/utils';
import { useCheckUserHasWriteTypePermission } from '../../../../utils/usersUtils';
import { OrgunitTypesApi } from '../../types/orgunitTypes';

const getOrgunitTypes = (projectId?: number): Promise<OrgunitTypesApi> => {
    return getRequest(
        projectId
            ? `/api/v2/orgunittypes/?project=${projectId}`
            : '/api/v2/orgunittypes/',
    );
};

export const useGetOrgUnitTypesDropdownOptions = (
    projectId?: number,
    onlyWriteAccess = false,
): UseQueryResult<DropdownOptions<string>[], Error> => {
    const queryKey: any[] = ['orgunittypes-dropdown', projectId];
    const checkUserHasWriteTypePermission =
        useCheckUserHasWriteTypePermission();
    return useSnackQuery(
        queryKey,
        () => getOrgunitTypes(projectId),
        undefined,
        {
            keepPreviousData: true,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: data => {
                if (!data) return [];
                let { orgUnitTypes } = data;
                if (onlyWriteAccess) {
                    orgUnitTypes = orgUnitTypes.filter(orgunitType =>
                        checkUserHasWriteTypePermission(orgunitType.id),
                    );
                }
                return orgUnitTypes
                    .sort((orgunitType1, orgunitType2) => {
                        const depth1 = orgunitType1.depth ?? 0;
                        const depth2 = orgunitType2.depth ?? 0;
                        return depth1 < depth2 ? -1 : 1;
                    })
                    .map(orgunitType => {
                        return {
                            value: orgunitType.id.toString(),
                            label: orgunitType.name,
                            original: orgunitType,
                        };
                    });
            },
        },
    );
};
