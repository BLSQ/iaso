import { makeUrlWithParams } from '../../../../../libs/utils';
import { getRequest } from '../../../../../libs/Api';
import { useSnackQuery } from '../../../../../libs/apiHooks';
import { ApproveChangesPaginated, ApproveOrgUnitParams } from '../../types';

const apiUrl = '/api/orgunits/changes';

const getOrgUnitChangeProposals = (options: ApproveOrgUnitParams) => {
    const { pageSize, ...params } = options as Record<string, any>;
    if (pageSize) {
        params.limit = pageSize;
        delete params.pageSize;
    }

    const url = makeUrlWithParams(apiUrl, params);

    return getRequest(url) as Promise<ApproveChangesPaginated>;
};

export const useGetApprovalProposals = (params: ApproveOrgUnitParams) => {
    return useSnackQuery({
        queryKey: ['getApprovalProposals'],
        queryFn: () => getOrgUnitChangeProposals(params),
    });
};
