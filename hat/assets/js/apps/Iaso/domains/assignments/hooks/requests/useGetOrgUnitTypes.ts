/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { DropdownOptions } from '../../../../types/utils';
import { OrgunitTypesApi } from '../../../orgUnits/types/orgunitTypes';

const getOrgunitTypes = (): Promise<OrgunitTypesApi> => {
    return getRequest('/api/orgunittypes/');
};

export const useGetOrgUnitTypes = (): UseQueryResult<
    DropdownOptions<string>[],
    Error
> => {
    const queryKey: any[] = ['orgunittypes'];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getOrgunitTypes(), undefined, {
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
                    };
                });
        },
    });
};
