import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';

export const useGetPages = options => {
    const params = {
        limit: options.pageSize,
        page: options.page,
    };
    if (options.order && options.order !== '') {
        params.order = options.order;
    }

    const getURL = urlParams => {
        const filteredParams = Object.entries(urlParams).filter(
            ([key, value]) => value !== undefined,
        );

        const queryString = new URLSearchParams(
            Object.fromEntries(filteredParams),
        );

        return `/api/pages/?${queryString.toString()}`;
    };

    return useSnackQuery(
        ['iaso', 'pages', params],
        () => getRequest(getURL(params)),
        undefined,
        { cacheTime: 0, structuralSharing: false },
    );
};
