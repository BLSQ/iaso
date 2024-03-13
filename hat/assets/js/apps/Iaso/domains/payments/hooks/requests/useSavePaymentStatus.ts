import { UseMutationResult } from 'react-query';
import { patchRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { PaymentStatus } from '../../types';
import { waitFor } from '../../../../utils';

const apiUrl = `/api/payments/`;

const savePaymentStatus = (body: {
    status: PaymentStatus;
    id: number;
}): Promise<any> => {
    const { id, status } = body;
    // return patchRequest(`${apiUrl}/${id}`, { status });
    waitFor(500);
    console.log('PATCH', body);
    return body;
};

export const useSavePaymentStatus = (): UseMutationResult => {
    // TODO: maybe use mutation result to set cache value?
    return useSnackMutation({
        mutationFn: body => savePaymentStatus(body),
        invalidateQueryKey: ['paymentLots', 'payments'],
    });
};
