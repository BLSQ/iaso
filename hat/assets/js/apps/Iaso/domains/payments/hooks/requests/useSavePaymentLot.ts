import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import MESSAGES from '../../messages';

export type CreatePaymentLotQuery = {
    id?: number;
    name: string;
    comment?: string;
    potential_payments?: number[];
};
export type UpdatePaymentLotQuery = {
    id?: number;
    name: string;
    comment?: string;
    potential_payments?: number[];
    mark_payments_as_sent?: boolean;
};

export type SavePaymentLotQuery = CreatePaymentLotQuery | UpdatePaymentLotQuery;

type CreateEditPaymentLotFunction<T extends 'create' | 'edit'> = (
    body: T extends 'create'
        ? SavePaymentLotQuery
        : Partial<SavePaymentLotQuery>,
    type: T,
) => Promise<any>;

const paymentLotEndpoint = '/api/payments/lots/';

// TODO replace with classic PATCH
const patchPaymentLot = async (body: Partial<UpdatePaymentLotQuery>) => {
    const url = `${paymentLotEndpoint}${body.id}/`;
    return patchRequest(url, body);
};

const postPaymentLot = async (body: Partial<SavePaymentLotQuery>) => {
    return postRequest(paymentLotEndpoint, body);
};

const createEditPaymentLot: CreateEditPaymentLotFunction<'create' | 'edit'> = (
    body,
    type,
) => {
    if (type === 'edit') {
        return patchPaymentLot(body as Partial<SavePaymentLotQuery>);
    }
    if (type === 'create') {
        return postPaymentLot(body as SavePaymentLotQuery);
    }
    throw new Error(`wrong type expected: create or edit, got: ${type}`);
};

export const useSavePaymentLot = (
    type: 'create' | 'edit',
    onSuccess?: () => void,
): UseMutationResult => {
    const snackSuccessMessage =
        type === 'create' ? MESSAGES.paymentLotTaskLaunched : undefined;
    return useSnackMutation({
        mutationFn: (data: Partial<SavePaymentLotQuery>) =>
            createEditPaymentLot(data, type),
        invalidateQueryKey: ['paymentLots', 'potentialPayments'],
        options: { onSuccess },
        snackSuccessMessage,
    });
};

const markPaymentsAsSent = async (body: Partial<UpdatePaymentLotQuery>) => {
    const url = `${paymentLotEndpoint}${body.id}/`;
    const queryParams = body.mark_payments_as_sent
        ? `?mark_payments_as_sent=${body.mark_payments_as_sent}`
        : '';
    return patchRequest(`${url}${queryParams}`, body);
};

export const useMarkPaymentsAsSent = (
    onSuccess?: () => void,
): UseMutationResult => {
    return useSnackMutation({
        mutationFn: (data: Partial<UpdatePaymentLotQuery>) =>
            markPaymentsAsSent(data),
        invalidateQueryKey: ['paymentLots', 'potentialPayments'],
        options: { onSuccess },
    });
};
