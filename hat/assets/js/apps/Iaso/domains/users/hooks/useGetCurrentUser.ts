import { LangOptions } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { useLocale } from '../../app/contexts/LocaleContext';
import { Profile } from '../../teams/types/profile';

export const useGetCurrentUser = (
    enabled: boolean,
    showError = true,
): UseQueryResult<Profile, Error> => {
    const queryKey: any[] = ['currentUser'];
    const { setLocale, locale } = useLocale();
    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest('/api/profiles/me/'),
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
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    });
};
