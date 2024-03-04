/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import moment from 'moment';
import { makeUrlWithParams } from '../../../../libs/utils';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { PaymentLotsParams, PaymentLotPaginated } from '../../types';
import { apiDateFormat } from '../../../../utils/dates';

const apiUrl = '/api/payments/lots/';

const getPaymentLots = (options: PaymentLotsParams) => {
    const {
        created_at_after,
        created_at_before,
        parent_id,
        status,
        users,
        page,
    } = options;
    const apiParams = {
        order: options.order || '-created_at',
        limit: options.pageSize || 20,
        page,
        created_at_after: created_at_after
            ? moment(created_at_after, 'L').format(apiDateFormat)
            : undefined,
        created_at_before: created_at_before
            ? moment(created_at_before, 'L').format(apiDateFormat)
            : undefined,
        parent_id,
        status,
        users,
    };

    const url = makeUrlWithParams(apiUrl, apiParams);

    return getRequest(url) as Promise<PaymentLotPaginated>;
};

export const useGetPaymentLots = (
    params: PaymentLotsParams,
): UseQueryResult<PaymentLotPaginated, Error> => {
    return useSnackQuery({
        queryKey: ['paymentLots', params],
        queryFn: () => getPaymentLots(params),
        options: {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
        },
    });
};
