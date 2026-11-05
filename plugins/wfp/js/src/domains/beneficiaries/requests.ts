import { UseQueryResult } from 'react-query';
import { PaginatedResponse } from 'Iaso/domains/app/types';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { formatParams } from 'Iaso/utils/requests';
import {
    Params,
    Beneficiary,
    Filters,
    BeneficiaryOptions,
    ExportKind,
} from './types';

const beneficiariesUrl = '/api/wfp/beneficiaries/';

export const useGetBeneficiaries = (
    params: Params,
): UseQueryResult<PaginatedResponse<Beneficiary>> => {
    // the visits of each journey are listed by their number
    const queryString = new URLSearchParams(
        formatParams({ ...params, visits_order: 'number' }),
    ).toString();
    return useSnackQuery({
        queryKey: ['wfpBeneficiaries', queryString],
        queryFn: () => getRequest(`${beneficiariesUrl}?${queryString}`),
        options: { keepPreviousData: true },
    });
};

export const useGetBeneficiaryOptions =
    (): UseQueryResult<BeneficiaryOptions> =>
        useSnackQuery({
            queryKey: ['wfpBeneficiaryOptions'],
            queryFn: () => getRequest(`${beneficiariesUrl}options/`),
            options: { staleTime: Infinity },
        });

export const exportUrl = (kind: ExportKind, filters: Filters): string => {
    const queryString = new URLSearchParams(
        formatParams({ ...filters }),
    ).toString();
    return `${beneficiariesUrl}export/${kind}/${queryString ? `?${queryString}` : ''}`;
};
