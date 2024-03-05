/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

export type SavePaymentLotQuery = {
    id?: number;
    name: string;
    comment?: string;
    potential_payments?: number[];
    mark_payments_as_sent?: boolean;
};

const endpoint = '/api/payments/lots/';

const putPaymentLot = async (body: Partial<SavePaymentLotQuery>) => {
    const url = `${endpoint}${body.id}/`;
    const queryParams = body.mark_payments_as_sent
        ? `?mark_payments_as_sent=${body.mark_payments_as_sent}`
        : '';
    return patchRequest(`${url}${queryParams}`, body);
};

const postPaymentLot = async (body: SavePaymentLotQuery) => {
    return postRequest(endpoint, body);
};

export const useSavePaymentLot = (
    type: 'create' | 'edit',
    onSuccess?: () => void,
): UseMutationResult => {
    const ignoreErrorCodes = [400];
    const editPaymentLot = useSnackMutation({
        mutationFn: (data: Partial<SavePaymentLotQuery>) => putPaymentLot(data),
        invalidateQueryKey: ['paymentLots', 'potentialPayments'],
        ignoreErrorCodes,
        options: { onSuccess },
    });
    const createPaymentLot = useSnackMutation({
        mutationFn: (data: SavePaymentLotQuery) => postPaymentLot(data),
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
