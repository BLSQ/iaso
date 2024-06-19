import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { Profile } from '../../teams/types/profile';

export const useGetCurrentUser = (
    enabled: boolean,
): UseQueryResult<Profile, Error> => {
    const queryKey: any[] = ['currentUser'];
    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest('/api/profiles/me/'),
        dispatchOnError: true,
        options: {
            onError: () => {
                console.warn('User not connected');
            },
            retry: false,
            enabled,
            keepPreviousData: true,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    });
};
