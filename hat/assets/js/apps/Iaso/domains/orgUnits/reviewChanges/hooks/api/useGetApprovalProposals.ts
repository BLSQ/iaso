import { UseQueryResult } from 'react-query';
import { makeUrlWithParams } from '../../../../../libs/utils';
import { getRequest } from '../../../../../libs/Api';
import { useSnackQuery } from '../../../../../libs/apiHooks';
import {
    OrgUnitChangeRequestsPaginated,
    ApproveOrgUnitParams,
} from '../../types';

const apiUrl = '/api/orgunits/changes/';

const getOrgUnitChangeProposals = (options: ApproveOrgUnitParams) => {
    const apiParams = {
        parent_id: options.parent_id,
        groups: options.groups,
        org_unit_type_id: options.org_unit_type_id,
        status: options.status,
        order: options.order || '-updated_at',
        limit: options.pageSize || 10,
        page: options.page,
    };

    const url = makeUrlWithParams(apiUrl, apiParams);

    return getRequest(url) as Promise<OrgUnitChangeRequestsPaginated>;
};

export const useGetApprovalProposals = (
    params: ApproveOrgUnitParams,
): UseQueryResult<OrgUnitChangeRequestsPaginated, Error> => {
    return useSnackQuery({
        queryKey: ['getApprovalProposals', params],
        queryFn: () => getOrgUnitChangeProposals(params),
        options: {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
        },
    });
};
