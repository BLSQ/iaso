import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { Payment, PaymentStatus } from '../../types';
import { Selection } from '../../../orgUnits/types/selection';
import { waitFor } from '../../../../utils';
import MESSAGES from '../../messages';

const apiUrl = `/api/payments/`;
const taskApi = `/api/tasks/create/paymentsbulkupdate/`;

const savePaymentStatus = async (body: {
    status: PaymentStatus;
    id: number;
}): Promise<any> => {
    const { id, status } = body;
    await waitFor(500);
    return patchRequest(`${apiUrl}${id}/`, { status });
};

export type SavePaymentStatusArgs = { status: PaymentStatus; id: number };

export const useSavePaymentStatus = (): UseMutationResult<
    any,
    any,
    SavePaymentStatusArgs,
    any
> => {
    return useSnackMutation({
        mutationFn: body => savePaymentStatus(body),
        invalidateQueryKey: ['paymentLots', 'payments'],
    });
};
export type BulkPaymentSaveBody = Selection<Payment> & {
    status: PaymentStatus;
    payment_lot_id: number;
};
const saveBulkPayments = async (body: BulkPaymentSaveBody): Promise<any> => {
    const formattedBody = {
        selected_ids: body.selectedItems?.map(item => item.id),
        unselected_ids: body.unSelectedItems?.map(item => item.id),
        select_all: body.selectAll,
        status: body.status,
        payment_lot_id: body.payment_lot_id,
    };
    await waitFor(500);
    return postRequest(taskApi, formattedBody);
};

export const useBulkSavePaymentStatus = (): UseMutationResult<
    any,
    any,
    BulkPaymentSaveBody,
    any
> => {
    return useSnackMutation({
        mutationFn: body => saveBulkPayments(body),
        invalidateQueryKey: ['paymentLots', 'payments'],
        snackSuccessMessage: MESSAGES.paymentsBulkUpdateLaunched,
    });
};
