import { UseQueryResult } from 'react-query';
import { useDispatch } from 'react-redux';
import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';
import { Profile } from '../../teams/types/profile';
import { setCurrentUser } from '../../users/actions';

const getCurrentUser = (): Promise<Profile> => {
    return getRequest('/api/profiles/me/');
};
export const useGetCurrentUser = (): UseQueryResult<Profile, Error> => {
    const queryKey: any[] = ['currentUser'];
    const dispatch = useDispatch();
    // @ts-ignore
    return useSnackQuery({
        queryKey,
        queryFn: () => getCurrentUser(),
        dispatchOnError: false,
        options: {
            onSuccess: data => {
                dispatch(setCurrentUser(data));
            },
            onError: () => console.warn('User not connected'),
            retry: false,
        },
    });
};
