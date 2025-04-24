import { UseMutationResult } from 'react-query';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { patchRequest } from '../../../../../libs/Api';
import { useSnackMutation } from '../../../../../libs/apiHooks';
import { Selection } from '../../../types/selection';
import MESSAGES from '../../messages';
import {
    ChangeRequestValidationStatus,
    OrgUnitChangeRequest,
    ApproveOrgUnitParams,
} from '../../types';
import { useGetApprovalProposalsParams } from './useGetApprovalProposals';

const taskApi = `/api/orgunits/changes/bulk_review/`;

export type BulkSaveBody = Selection<OrgUnitChangeRequest> & {
    status: ChangeRequestValidationStatus;
    rejection_comment?: string;
};
const saveBulkChangeRequests = async (
    body: BulkSaveBody,
    apiParams: Record<string, any>,
): Promise<any> => {
    const formattedBody = {
        selected_ids: body.selectedItems?.map(item => item.id),
        unselected_ids: body.unSelectedItems?.map(item => item.id),
        select_all: body.selectAll,
        status: body.status,
        rejection_comment: body.rejection_comment,
    };

    const url = makeUrlWithParams(taskApi, apiParams);
    return patchRequest(url, formattedBody);
};

export const useBulkSaveChangeRequestStatus = (
    params: ApproveOrgUnitParams,
): UseMutationResult<any, any, BulkSaveBody, any> => {
    const apiParams = useGetApprovalProposalsParams(params);
    return useSnackMutation({
        mutationFn: body => saveBulkChangeRequests(body, apiParams),
        invalidateQueryKey: ['getApprovalProposals'],
        snackSuccessMessage: MESSAGES.changeSelectedChangeRequestsLaunched,
    });
};
