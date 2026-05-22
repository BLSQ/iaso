import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

export const useGetCustomTranslations = (
    accountId?: number,
): UseQueryResult<Record<string, Record<string, string>>, Error> => {
    return useSnackQuery({
        queryKey: ['customTranslations', accountId],
        queryFn: () =>
            getRequest(`/api/custom_translations/?account_id=${accountId}`),
        options: {
            retry: false,
            keepPreviousData: true,
            cacheTime: Infinity,
            staleTime: Infinity,
            select: data => data.custom_translations,
            enabled: Boolean(accountId),
        },
    });
};
