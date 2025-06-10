import { UseMutationResult } from 'react-query';

import { makeUrlWithParams } from 'Iaso/libs/utils';
import { postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';

import MESSAGES from '../../messages';
import { OrgUnitChangeRequest, ApproveOrgUnitParams } from '../../types';
import { Selection } from '../../../types/selection';
import { useGetApprovalProposalsParams } from './useGetApprovalProposals';

export type BulkDeleteBody = Selection<OrgUnitChangeRequest> & {
    selected_ids?: number;
    unselected_ids?: number;
    select_all?: boolean;
};

const bulkDeleteChangeRequests = async (
    body: BulkDeleteBody,
    apiParams: Record<string, any>,
): Promise<any> => {
    const url = makeUrlWithParams(
        `/api/orgunits/changes/bulk_delete/`,
        apiParams,
    );
    const formattedBody = {
        selected_ids: body.selectedItems?.map(item => item.id),
        unselected_ids: body.unSelectedItems?.map(item => item.id),
        select_all: body.selectAll,
        restore: apiParams.is_soft_deleted === 'true',
    };
    return postRequest(url, formattedBody);
};

export const useBulkDeleteChangeRequests = (
    params: ApproveOrgUnitParams,
): UseMutationResult<any, any, BulkDeleteBody, any> => {
    const apiParams = useGetApprovalProposalsParams(params);
    return useSnackMutation({
        mutationFn: body => bulkDeleteChangeRequests(body, apiParams),
        invalidateQueryKey: ['getApprovalProposals'],
        snackSuccessMessage: MESSAGES.bulkDeleteSuccess,
    });
};
