import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

export const useGetPages = (options: Record<string, any>) => {
    const params: Record<string, any> = {
        limit: options.pageSize,
        page: options.page,
        needs_authentication: options.needs_authentication,
        userId: options.userId,
        userRoleIds: options.userRoleIds,
    };
    if (options.order && options.order !== '') {
        params.order = options.order;
    }

    if (options.search && options.search !== '') {
        params.search = options.search;
    }

    const getURL = (urlParams: Record<string, any>) => {
        const filteredParams = Object.entries(urlParams).filter(
            ([_key, value]) => value !== undefined,
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
