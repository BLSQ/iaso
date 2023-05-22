/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
// @ts-ignore
import { getSort } from 'bluesquare-components';

import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';

import { makeUrlWithParams } from '../../../libs/utils';

import { RegistryDetailParams } from '../types';
import { CompletenessApiResponse } from '../../completenessStats/types';

type ApiParams = {
    org_unit_type_ids?: number;
    form_id?: string;
    limit: string;
    order: string;
    page: string;
    parent_org_unit_id: string;
    without_submissions: boolean;
};
export const defaultSorted = [{ id: 'orgunit__name', desc: false }];

export const useGetEmptyInstanceOrgUnits = (
    params: RegistryDetailParams,
    orgUnitTypeId?: number,
): UseQueryResult<CompletenessApiResponse, Error> => {
    const apiParams: ApiParams = {
        org_unit_type_ids: orgUnitTypeId,
        form_id: params.formIds,
        limit: params.missingSubmissionsPageSize || '10',
        order: params.missingSubmissionsOrder || getSort(defaultSorted),
        page: params.missingSubmissionsPage || '1',
        parent_org_unit_id: params.orgUnitId,
        without_submissions: true,
    };
    const url = makeUrlWithParams(
        '/api/v2/completeness_stats/',
        apiParams as Record<string, any>,
    );
    return useSnackQuery({
        queryKey: ['registry-orgunits-without-instances', apiParams],
        queryFn: () => getRequest(url),
        options: {
            enabled: Boolean(orgUnitTypeId && params.formIds),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
        },
    });
};
