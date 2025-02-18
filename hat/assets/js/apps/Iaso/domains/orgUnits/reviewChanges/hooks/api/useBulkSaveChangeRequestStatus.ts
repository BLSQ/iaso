import { UseMutationResult } from 'react-query';
import { patchRequest } from '../../../../../libs/Api';
import { useSnackMutation } from '../../../../../libs/apiHooks';
import { Selection } from '../../../types/selection';
import MESSAGES from '../../messages';
import {
    ChangeRequestValidationStatus,
    OrgUnitChangeRequest,
} from '../../types';

const taskApi = `/api/orgunits/changes/bulk_review/`;

export type BulkSaveBody = Selection<OrgUnitChangeRequest> & {
    status: ChangeRequestValidationStatus;
};
const saveBulkChangeRequests = async (body: BulkSaveBody): Promise<any> => {
    const formattedBody = {
        selected_ids: body.selectedItems?.map(item => item.id),
        unselected_ids: body.unSelectedItems?.map(item => item.id),
        select_all: body.selectAll,
        status: body.status,
    };
    return patchRequest(taskApi, formattedBody);
};

export const useBulkSaveChangeRequestStatus = (): UseMutationResult<
    any,
    any,
    BulkSaveBody,
    any
> => {
    return useSnackMutation({
        mutationFn: body => saveBulkChangeRequests(body),
        invalidateQueryKey: ['getApprovalProposals'],
        snackSuccessMessage: MESSAGES.changeSelectedChangeRequestsLaunched,
    });
};
