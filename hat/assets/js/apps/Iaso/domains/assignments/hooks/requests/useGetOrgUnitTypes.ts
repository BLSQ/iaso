/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { DropdownOptions } from '../../../../types/utils';

import { OrgunitTypesApi } from '../../types/orgunitTypes';

const getOrgunitTypes = (): Promise<OrgunitTypesApi> => {
    return getRequest('/api/orgunittypes/');
};

export const useGetOrgUnitTypes = (): UseQueryResult<
    DropdownOptions<string>,
    Error
> => {
    const queryKey: any[] = ['orgunittypes'];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getOrgunitTypes(), undefined, {
        select: data => {
            if (!data) return [];
            return data.orgUnitTypes.map(orgunitType => {
                return {
                    value: orgunitType.id.toString(),
                    label: orgunitType.name,
                };
            });
        },
    });
};
