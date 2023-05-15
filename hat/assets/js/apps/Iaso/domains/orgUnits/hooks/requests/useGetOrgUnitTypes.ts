import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { DropdownOptions } from '../../../../types/utils';

import { OrgunitTypesApi } from '../../types/orgunitTypes';
import { staleTime } from '../../config';

const getOrgunitTypes = (): Promise<OrgunitTypesApi> => {
    return getRequest('/api/orgunittypes/');
};

export const useGetOrgUnitTypes = (): UseQueryResult<
    DropdownOptions<string>[],
    Error
> => {
    const queryKey: any[] = ['orgunittypes'];
    // @ts-ignore
    return useSnackQuery({
        queryKey,
        queryFn: () => getOrgunitTypes(),
        options: {
            staleTime,
            select: data => {
                if (!data) return [];
                return data.orgUnitTypes
                    .sort((orgunitType1, orgunitType2) => {
                        if (orgunitType1.depth && orgunitType2.depth) {
                            return orgunitType1.depth < orgunitType2.depth
                                ? -1
                                : 1;
                        }
                        return 1;
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
