import { UseQueryResult } from 'react-query';
// @ts-ignore
import { getSort } from 'bluesquare-components';

import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';

import { PaginatedInstances } from '../../instances/types/instance';
import { makeUrlWithParams } from '../../../libs/utils';
import { RegistryDetailParams } from '../types';
import { defaultSorted } from '../config';

export const useGetInstances = (
    params: RegistryDetailParams,
    orgUnitTypeId?: number,
): UseQueryResult<PaginatedInstances, Error> => {
    const apiParams: Record<string, any> = {
        orgUnitTypeId,
        form_ids: params.formId,
        limit: params.pageSize || 20,
        order: params.order || getSort(defaultSorted),
        page: params.page || 1,
        showDeleted: false,
    };
    const url = makeUrlWithParams('/api/instances/', apiParams);
    return useSnackQuery({
        queryKey: ['registry-instances', params, orgUnitTypeId],
        queryFn: () => getRequest(url),
        options: {
            enabled: Boolean(orgUnitTypeId && params.formId),
        },
    });
};
