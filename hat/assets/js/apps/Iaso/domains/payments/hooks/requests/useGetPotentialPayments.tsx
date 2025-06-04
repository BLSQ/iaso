import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { apiDateFormat, formatDateString } from '../../../../utils/dates';
import { PotentialPaymentParams, PotentialPaymentPaginated } from '../../types';

const apiUrl = '/api/potential_payments/';

const getPotentialPayments = (url: string) => {
    return getRequest(url) as Promise<PotentialPaymentPaginated>;
};

export const useGetPotentialPayments = (
    params: PotentialPaymentParams,
): UseQueryResult<PotentialPaymentPaginated, Error> => {
    const {
        change_requests__created_at_after,
        change_requests__created_at_before,
        parent_id,
        forms,
        users,
        user_roles,
        page,
    } = params;
    const apiParams = {
        order: params.order || 'user__last_name',
        limit: params.pageSize || 10,
        page,
        change_requests__created_at_after: formatDateString(
            change_requests__created_at_after,
            'L',
            apiDateFormat,
        ),
        change_requests__created_at_before: formatDateString(
            change_requests__created_at_before,
            'L',
            apiDateFormat,
        ),
        parent_id,
        forms,
        users,
        user_roles,
    };
    const url = makeUrlWithParams(apiUrl, apiParams);
    return useSnackQuery({
        queryKey: ['potentialPayments', url],
        queryFn: () => getPotentialPayments(url),
        options: {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
        },
    });
};
