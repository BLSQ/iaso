import { useQuery } from 'react-query';
import { sendRequest } from './networking';

export const useGetProfiles = () => {
    return {
        query: useQuery(
            ['iaso', 'users'],
            async () => {
                const request = await sendRequest('GET', '/api/profiles/');
                return request.profiles;
            },
            { cacheTime: 0, structuralSharing: false },
        ),
    };
};
