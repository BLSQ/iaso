import { UseMutationResult, UseQueryResult } from 'react-query';
import moment from 'moment';

// @ts-ignore
import { apiDateFormat } from 'Iaso/utils/dates.ts';
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
import { Instance } from '../../../instances/types/instance';

export interface PaginatedBeneficiaries extends Pagination {
    beneficiary: Array<Beneficiary>;
}

type Params = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
    location?: string;
    dateFrom?: string;
    dateTo?: string;
};

type ApiParams = {
    limit: string;
    order: string;
    page: string;
    search?: string;
    orgUnitId?: string;
    dateFrom?: string;
    dateTo?: string;
};

type GetAPiParams = {
    url: string;
    apiParams: ApiParams;
};
export const useGetBeneficiariesApiParams = (params: Params): GetAPiParams => {
    const apiParams: ApiParams = {
        limit: params.pageSize || '20',
        order: params.order || 'id',
        page: params.page || '1',
    };
    if (params.search) {
        apiParams.search = params.search;
    }

    if (params.location) {
        apiParams.orgUnitId = params.location;
    }

    if (params.dateFrom) {
        apiParams.dateFrom = moment(params.dateFrom).format(apiDateFormat);
    }

    if (params.dateTo) {
        apiParams.dateTo = moment(params.dateTo).format(apiDateFormat);
    }

    // @ts-ignore
    const searchParams = new URLSearchParams(apiParams);
    return {
        url: `/api/entity/beneficiary/?${searchParams.toString()}`,
        apiParams,
    };
};

export const useGetBeneficiariesPaginated = (
    params: Params,
): UseQueryResult<PaginatedBeneficiaries, Error> => {
    const { url, apiParams } = useGetBeneficiariesApiParams(params);
    // @ts-ignore
    return useSnackQuery({
        queryKey: ['beneficiaries', apiParams],
        queryFn: () => getRequest(url),
        options: {
            staleTime: 60000,
        },
    });
};

export const useGetBeneficiaries = (): UseQueryResult<
    Array<Beneficiary>,
    Error
> =>
    useSnackQuery({
        queryKey: ['beneficiaries'],
        queryFn: () => getRequest('/api/entity/beneficiary'),
    });

export const useDeleteBeneficiary = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: body => deleteRequest(`/api/entity/${body.id}/`),
        snackSuccessMessage: MESSAGES.deleteSuccess,
        snackErrorMsg: MESSAGES.deleteError,
        invalidateQueryKey: ['beneficiaries'],
    });

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
    return useSnackQuery({
        queryKey,
        queryFn: () => getBeneficiary(beneficiaryId),
        options: {
            retry: false,
        },
    });
};

const getSubmissions = (id?: number) => {
    return getRequest(`/api/instances/?entityId=${id}`);
};

export const useGetSubmissions = (
    id?: number,
): UseQueryResult<Instance[], Error> => {
    return useSnackQuery({
        queryKey: ['submissionsForEntity', id],
        queryFn: () => getSubmissions(id),
        options: {
            retry: false,
            enabled: Boolean(id),
            select: data => {
                if (!data) return [];
                return data.instances;
            },
        },
    });
};
