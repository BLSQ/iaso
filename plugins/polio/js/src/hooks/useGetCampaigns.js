import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { getRequest } from 'Iaso/libs/Api';

export const useGetCampaigns = (options = {}) => {
    const params = {
        limit: options.pageSize,
        page: options.page,
        order: options.order,
        country__id__in: options.countries,
        search: options.search,
        round_one__started_at__gte: options.r1StartFrom,
        round_one__started_at__lte: options.r1StartTo,
        deletion_status: options.showOnlyDeleted ? 'deleted' : undefined,
        campaign_type: options.campaignType ?? 'all',
        campaign_groups: options.campaignGroups,
        show_test: options.show_test ?? false,
        // Ugly fix to prevent the full list of campaigns showing when waiting for the value of countries
        enabled: options.enabled ?? true,
    };

    const getURL = urlParams => {
        const filteredParams = Object.entries(urlParams).filter(
            // eslint-disable-next-line no-unused-vars
            ([_key, value]) => value !== undefined,
        );

        const queryString = new URLSearchParams(
            Object.fromEntries(filteredParams),
        );

        return `/api/polio/campaigns/?${queryString.toString()}`;
    };

    // adding the params to the queryKey to make sure it fetches when the query changes
    return {
        // eslint-disable-next-line no-return-assign
        exportToCSV: () =>
            (window.location.href = `${getURL({
                ...params,
                limit: undefined,
                page: undefined,
                format: 'csv',
            })}`),
        query: useSnackQuery(
            ['polio', 'campaigns', params],
            () => getRequest(getURL(params)),
            undefined,
            {
                cacheTime: 0,
                structuralSharing: false,
                refetchOnWindowFocus: false,
                enabled: !!params.enabled,
            },
        ),
    };
};
