import { useQuery } from 'react-query';
import { sendRequest } from './networking';

export const useGetPage = slug => {
    return {
        query: useQuery(
            ['iaso', 'page', slug],
            async () => {
                // additional props are WIP
                return sendRequest('GET', `/api/pages/${slug}`);
            },
            { cacheTime: 0, structuralSharing: false },
        ),
    };
};

export const useGetPages = options => {
    const params = {
        limit: options.pageSize,
        page: options.page,
    };

    const getURL = urlParams => {
        const filteredParams = Object.entries(urlParams).filter(
            ([key, value]) => value !== undefined,
        );

        const queryString = new URLSearchParams(
            Object.fromEntries(filteredParams),
        );

        return `/api/pages/?${queryString.toString()}`;
    };

    return {
        query: useQuery(
            ['iaso', 'pages', params],
            async () => {
                // additional props are WIP
                return sendRequest('GET', getURL(params));
            },
            { cacheTime: 0, structuralSharing: false },
        ),
    };
};
