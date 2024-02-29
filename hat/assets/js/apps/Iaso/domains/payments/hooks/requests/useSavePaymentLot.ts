/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import { putRequest, postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

export type SavePaymentLotQuery = {
    id?: number;
    name: string;
    comment?: string;
    potential_payments?: number[];
};

const endpoint = '/api/payments/lots/';

const putPaymentLot = async (body: Partial<SavePaymentLotQuery>) => {
    const url = `${endpoint}${body.id}/`;
    return putRequest(url, body);
};

const postPaymentLot = async (body: SavePaymentLotQuery) => {
    return postRequest(endpoint, body);
};

export const useSavePaymentLot = (
    type: 'create' | 'edit',
): UseMutationResult => {
    const ignoreErrorCodes = [400];
    const editPaymentLot = useSnackMutation({
        mutationFn: (data: Partial<SavePaymentLotQuery>) => putPaymentLot(data),
        invalidateQueryKey: ['paymentLotsList', 'potentialPayments'],
        ignoreErrorCodes,
    });
    const createPaymentLot = useSnackMutation({
        mutationFn: (data: SavePaymentLotQuery) => postPaymentLot(data),
        invalidateQueryKey: ['paymentLotsList', 'potentialPayments'],
        ignoreErrorCodes,
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
