import { useSnackQuery } from 'iaso/libs/apiHooks';
import { getRequest } from 'iaso/libs/Api';

export const useGetProfiles = () =>
    useSnackQuery(
        ['iaso', 'users'],
        () => getRequest('/api/profiles/'),
        undefined,
        {
            cacheTime: 0,
            structuralSharing: false,
            select: data => data.profiles,
        },
    );
