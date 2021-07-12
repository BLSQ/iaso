import { useQuery } from 'react-query';
import { sendRequest } from './networking';

export const useGetPages = options => {
    const params = {
        limit: options.pageSize,
        page: options.page,
    };

    const getURL = params => {
        const filteredParams = Object.entries(params).filter(
            ([key, value]) => value !== undefined,
        );

        const queryString = new URLSearchParams(
            Object.fromEntries(filteredParams),
        );

        return `/api/pages/?${queryString.toString()}`;
    };

    return {
        query: useQuery(
            ['polio', 'pages', params],
            async () => {
                // additional props are WIP
                return sendRequest('GET', getURL(params));
            },
            { cacheTime: 0, structuralSharing: false },
        ),
    };
};
