import { LangOptions } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { setLocale } from '../../../utils/dates';
import { Profile } from '../../teams/types/profile';

export const useGetCurrentUser = (
    enabled: boolean,
    showError = true,
): UseQueryResult<Profile, Error> => {
    const queryKey: any[] = ['currentUser'];
    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest('/api/profiles/me/'),
        dispatchOnError: showError,
        options: {
            onError: () => {
                console.warn('User not connected');
            },
            onSuccess: result => {
                console.log('result', result);
                setLocale(result.language as LangOptions);
            },
            retry: false,
            enabled,
            keepPreviousData: true,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    });
};
