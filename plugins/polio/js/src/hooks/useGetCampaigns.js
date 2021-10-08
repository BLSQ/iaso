import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';

export const useGetCampaigns = options => {
    const params = {
        limit: options.pageSize,
        page: options.page,
        order: options.order,
        country__id__in: options.countries,
        obr_name__contains: options.obrName,
        round_one__started_at__gte: options.r1StartFrom?.replace(/-/gi, '/'),
        round_one__started_at__lte: options.r1StartTo?.replace(/-/gi, '/'),
    };

    const getURL = urlParams => {
        const filteredParams = Object.entries(urlParams).filter(
            ([key, value]) => value !== undefined,
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
            },
        ),
    };
};
