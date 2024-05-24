import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { useApiParams } from '../../../hooks/useApiParams';

type Args = {
    params: any;
    onSuccess?: () => void;
    enabled?: boolean;
};

export const tableDefaults = {
    order: '-similarity_score',
    page: 1,
    limit: 10,
};

export const useGetLinks = ({
    params,
    onSuccess,
    enabled,
}: Args): UseQueryResult => {
    console.log('ENABLED', enabled);
    const safeParams = useApiParams(params, tableDefaults);
    if (safeParams?.accountId) {
        delete safeParams.accountId;
    }
    const queryString = new URLSearchParams(safeParams).toString();
    return useSnackQuery({
        queryFn: () => getRequest(`/api/links/?${queryString}`),
        queryKey: ['links', queryString],
        options: {
            onSuccess,
            enabled,
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: 60000,
        },
    });
};
