import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetCampaigns = options => {
    const params = {
        limit: options.pageSize,
        page: options.page,
        order: options.order,
        search: options.searchQuery,
    };

    const getURL = params => {
        const filteredParams = Object.entries(params).filter(
            ([key, value]) => value !== undefined,
        );

        const queryString = new URLSearchParams(
            Object.fromEntries(filteredParams),
        );

        return '/api/polio/campaigns/?' + queryString.toString();
    };

    // adding the params to the queryKey to make sure it fetches when the query changes
    return {
        exportToCSV: () =>
            (window.location.href = `${getURL({
                ...params,
                limit: undefined,
                page: undefined,
                format: 'csv',
            })}`),
        query: useQuery(
            ['polio', 'campaigns', params],
            async () => {
                // additional props are WIP
                return sendRequest('GET', getURL(params));
            },
            {
                cacheTime: 0,
                structuralSharing: false,
                refetchOnWindowFocus: false,
            },
        ),
    };
};
