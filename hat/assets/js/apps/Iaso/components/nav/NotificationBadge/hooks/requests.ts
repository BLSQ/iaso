import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

export interface Notification {
    level: string;
    message: string;
    type: string;
}

export const useGetNotifications = (): UseQueryResult<
    Array<Notification>,
    Error
> => {
    return useSnackQuery({
        queryKey: ['notifications'],
        queryFn: () => getRequest('/api/notifications/'),
        options: {
            staleTime: 60,
            cacheTime: 60,
            keepPreviousData: true,
        },
    });
};
