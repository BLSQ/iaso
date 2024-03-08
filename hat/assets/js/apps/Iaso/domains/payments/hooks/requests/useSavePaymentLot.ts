/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

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

const paymentLotEndpoint = '/api/payments/lots/';

const putPaymentLot = async (body: Partial<UpdatePaymentLotQuery>) => {
    const url = `${paymentLotEndpoint}${body.id}/`;
    const queryParams = body.mark_payments_as_sent
        ? `?mark_payments_as_sent=${body.mark_payments_as_sent}`
        : '';
    return patchRequest(`${url}${queryParams}`, body);
};

const postPaymentLot = async (body: CreatePaymentLotQuery) => {
    return postRequest(paymentLotEndpoint, body);
};

export const useSavePaymentLot = (
    type: 'create' | 'edit',
    onSuccess?: () => void,
): UseMutationResult => {
    const ignoreErrorCodes = [400];
    const editPaymentLot = useSnackMutation({
        mutationFn: (data: Partial<UpdatePaymentLotQuery>) =>
            putPaymentLot(data),
        invalidateQueryKey: ['paymentLots', 'potentialPayments'],
        ignoreErrorCodes,
        options: { onSuccess },
    });
    const createPaymentLot = useSnackMutation({
        mutationFn: (data: CreatePaymentLotQuery) => postPaymentLot(data),
        invalidateQueryKey: ['paymentLots', 'potentialPayments'],
        ignoreErrorCodes,
        options: { onSuccess },
    });

    switch (type) {
        case 'create':
            return createPaymentLot;
        case 'edit':
            return editPaymentLot;
        default:
            throw new Error(
                `wrong type expected: create or edit, got: ${type}`,
            );
    }
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
