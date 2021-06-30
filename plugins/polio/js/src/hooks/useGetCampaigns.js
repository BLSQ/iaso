import { useQuery } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetCampaigns = options => {
    const params = {
        limit: options.pageSize,
        page: options.page,
        order: options.order,
        search: options.searchQuery,
    };

    // adding the params to the queryKey to make sure it fetches when the query changes
    return useQuery(
        ['polio', 'campaigns', params],
        async () => {
            const filteredParams = Object.entries(params).filter(
                ([key, value]) => value !== undefined,
            );

            const queryString = new URLSearchParams(
                Object.fromEntries(filteredParams),
            );

            // additional props are WIP
            return sendRequest(
                'GET',
                '/api/polio/campaigns/?' + queryString.toString(),
            );
        },
        { cacheTime: 0, structuralSharing: false },
    );
};
