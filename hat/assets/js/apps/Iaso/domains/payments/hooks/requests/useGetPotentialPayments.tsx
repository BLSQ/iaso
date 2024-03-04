/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import moment from 'moment';
import { makeUrlWithParams } from '../../../../libs/utils';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { PotentialPaymentParams, PotentialPaymentPaginated } from '../../types';
import { apiDateFormat } from '../../../../utils/dates';

const apiUrl = '/api/potential_payments/';

const getPotentialPayments = (options: PotentialPaymentParams) => {
    const {
        change_requests__created_at_after,
        change_requests__created_at_before,
        parent_id,
        forms,
        users,
        user_roles,
        page,
    } = options;
    const apiParams = {
        order: options.order || 'user__last_name',
        limit: options.pageSize || 20,
        page,
        change_requests__created_at_after: change_requests__created_at_after
            ? moment(change_requests__created_at_after, 'L').format(
                  apiDateFormat,
              )
            : undefined,
        change_requests__created_at_before: change_requests__created_at_before
            ? moment(change_requests__created_at_before, 'L').format(
                  apiDateFormat,
              )
            : undefined,
        parent_id,
        forms,
        users,
        user_roles,
    };

    const url = makeUrlWithParams(apiUrl, apiParams);

    return getRequest(url) as Promise<PotentialPaymentPaginated>;
};

export const useGetPotentialPayments = (
    params: PotentialPaymentParams,
): UseQueryResult<PotentialPaymentPaginated, Error> => {
    return useSnackQuery({
        queryKey: ['potentialPayments', params],
        queryFn: () => getPotentialPayments(params),
        options: {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
        },
    });
};
