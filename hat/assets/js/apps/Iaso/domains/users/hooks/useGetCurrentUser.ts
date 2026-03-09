import { LangOptions } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import { ProfileRetrieveResponseItem } from 'Iaso/domains/users/types';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { useLocale } from '../../app/contexts/LocaleContext';

export const useGetCurrentUser = (
    enabled: boolean,
    showError = true,
): UseQueryResult<ProfileRetrieveResponseItem, Error> => {
    const queryKey: any[] = ['currentUser'];
    const { setLocale, locale } = useLocale();
    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest('/api/v2/profiles/me/'),
        dispatchOnError: showError,
        options: {
            onError: () => {
                console.warn('User not connected');
            },
            onSuccess: result => {
                if (result.language && result.language !== locale) {
                    setLocale(result.language as LangOptions);
                }
            },
            retry: false,
            enabled,
            keepPreviousData: true,
            staleTime: Infinity,
            cacheTime: 1000 * 60 * 5,
        },
    });
};
