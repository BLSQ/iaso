import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { DropdownOptions } from '../../../../types/utils';

import { OrgunitTypesApi } from '../../types/orgunitTypes';
import { staleTime } from '../../config';

const getOrgUnitTypes = (project?: number): Promise<OrgunitTypesApi> => {
    if (project == null) {
        return getRequest(`/api/v2/orgunittypes/`);
    }
    return getRequest(`/api/v2/orgunittypes/?project=${project}`);
};

export const useGetOrgUnitTypes = (
    project?: number,
): UseQueryResult<DropdownOptions<string>[], Error> => {
    const queryKey: any[] = ['orgunittypes', project];
    // @ts-ignore
    return useSnackQuery({
        queryKey,
        queryFn: () => getOrgUnitTypes(project),
        options: {
            staleTime,
            select: data => {
                if (!data) return [];
                return data.orgUnitTypes
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
    });
};
