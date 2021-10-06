import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';

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
