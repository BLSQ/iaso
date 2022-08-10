import { UseMutationResult, UseQueryResult } from 'react-query';
import { useSnackMutation, useSnackQuery } from '../../../../libs/apiHooks';
import {
    deleteRequest,
    getRequest,
    postRequest,
    patchRequest,
} from '../../../../libs/Api';
import MESSAGES from '../../messages';

import { Beneficiary } from '../types/beneficiary';
import { Pagination } from '../../../../types/table';

export interface PaginatedBeneficiaries extends Pagination {
    beneficiary: Array<Beneficiary>;
}

type Params = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
    entityTypes?: string;
};

type NewParams = {
    limit: string;
    order: string;
    page: string;
    search?: string;
};

export const useGetBeneficiariesPaginated = (
    params: Params,
): UseQueryResult<PaginatedBeneficiaries, Error> => {
    const newParams: NewParams = {
        limit: params.pageSize || '20',
        order: params.order || 'id',
        page: params.page || '1',
    };
    if (params.search) {
        newParams.search = params.search;
    }

    // @ts-ignore
    const searchParams = new URLSearchParams(newParams);
    // @ts-ignore
    return useSnackQuery({
        queryKey: ['beneficiaries', newParams],
        queryFn: () =>
            getRequest(`/api/entity/beneficiary/?${searchParams.toString()}`),
        options: {
            staleTime: 60000,
        },
    });
};

export const useGetBeneficiaries = (): UseQueryResult<
    Array<Beneficiary>,
    Error
> => {
    // @ts-ignore
    return useSnackQuery(['beneficiaries'], () =>
        getRequest('/api/entity/beneficiary'),
    );
};

export const useDeleteBeneficiary = (): UseMutationResult =>
    useSnackMutation(
        body => deleteRequest(`/api/entity/${body.id}/`),
        MESSAGES.deleteSuccess,
        MESSAGES.deleteError,
        ['beneficiaries'],
    );

export const useSaveBeneficiary = (): UseMutationResult =>
    useSnackMutation(
        body =>
            body.id
                ? patchRequest(`/api/entity/${body.id}/`, body)
                : postRequest('/api/entity/', body),
        undefined,
        undefined,
        ['beneficiaries'],
    );

const getBeneficiary = (
    beneficiaryId: string | undefined,
): Promise<Beneficiary> => {
    return getRequest(`/api/entity/beneficiary/${beneficiaryId}`);
};
export const useGetBeneficiary = (
    beneficiaryId: string | undefined,
): UseQueryResult<Beneficiary, Error> => {
    const queryKey: any[] = ['beneficiary', beneficiaryId];
    return useSnackQuery(
        queryKey,
        () => getBeneficiary(beneficiaryId),
        undefined,
        {
            retry: false,
        },
    );
};
