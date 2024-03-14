import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { Payment, PaymentStatus } from '../../types';
import { waitFor } from '../../../../utils';
import { Selection } from '../../../orgUnits/types/selection';

const apiUrl = `/api/payments/`;

const savePaymentStatus = (body: {
    status: PaymentStatus;
    id: number;
}): Promise<any> => {
    const { id, status } = body;
    return patchRequest(`${apiUrl}${id}/`, { status });
};

export const useSavePaymentStatus = (): UseMutationResult => {
    // TODO: maybe use mutation result to set cache value?
    return useSnackMutation({
        mutationFn: body => savePaymentStatus(body),
        invalidateQueryKey: ['paymentLots', 'payments'],
    });
};

const saveBulkPayments = (body: Selection<Payment>): Promise<any> => {
    // return postRequest(apiUrl, body);
    waitFor(500);
    console.log('POST', body);
    return body;
};

export const useBulkSavePaymentStatus = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: body => saveBulkPayments(body),
        invalidateQueryKey: ['paymentLots', 'payments'],
    });
};
