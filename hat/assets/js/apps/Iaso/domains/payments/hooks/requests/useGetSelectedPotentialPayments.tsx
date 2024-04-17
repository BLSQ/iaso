/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { makeUrlWithParams } from '../../../../libs/utils';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { Selection } from '../../../orgUnits/types/selection';
import {
    PotentialPaymentParams,
    PotentialPayments,
    PotentialPayment,
} from '../../types';

const apiUrl = '/api/potential_payments/';

const getSelectedPotentialPayments = (
    options: PotentialPaymentParams,
    selection: Selection<PotentialPayment>,
) => {
    const {
        change_requests__created_at_after,
        change_requests__created_at_before,
        parent_id,
        forms,
        users,
        user_roles,
    } = options;
    const { selectAll, selectedItems, unSelectedItems } = selection;
    const apiParams = {
        order: options.order || 'user__last_name',
        change_requests__created_at_after,
        change_requests__created_at_before,
        parent_id,
        forms,
        users,
        user_roles,
        select_all: selectAll,
        selected_ids: selectedItems.map(item => item.id).join(','),
        unselected_ids: unSelectedItems.map(item => item.id).join(','),
    };

    const url = makeUrlWithParams(apiUrl, apiParams as Record<string, any>);

    return getRequest(url) as Promise<PotentialPayments>;
};

export const useGetSelectedPotentialPayments = (
    params: PotentialPaymentParams,
    selection: Selection<PotentialPayment>,
): UseQueryResult<PotentialPayment[], Error> => {
    return useSnackQuery({
        queryKey: ['selectedPotentialPayments', params, selection],
        queryFn: () => getSelectedPotentialPayments(params, selection),
        options: {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
            select: data => data?.results ?? [],
        },
    });
};
