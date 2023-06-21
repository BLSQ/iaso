import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { makeUrlWithParams } from '../../../../../../../hat/assets/js/apps/Iaso/libs/utils';

const getAfroMapData = ({ category, params }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accountId, ...apiParams } = params;
    apiParams.category = category;
    const baseUrl = `/api/polio/lqasmap/global/`;
    const url = makeUrlWithParams(baseUrl, apiParams);
    return getRequest(url);
};

export const useAfroMapShapes = ({
    category,
    enabled,
    params,
}): UseQueryResult<any, any> => {
    return useSnackQuery({
        queryFn: () => getAfroMapData({ category, params }),
        queryKey: ['lqasim-afro-map', category, params],
        options: {
            select: data => {
                if (!data) return [];
                return data.results;
            },
            enabled,
        },
    });
};

const getZoomedInShapes = ({ bounds, category, params }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accountId, ...apiParams } = params;
    apiParams.category = category;
    apiParams.bounds = bounds;
    const baseUrl = `/api/polio/lqasmap/zoomin/`;
    const url = makeUrlWithParams(baseUrl, apiParams);
    return getRequest(url);
};

export const useGetZoomedInShapes = ({
    bounds,
    category,
    enabled,
    params,
}): UseQueryResult<any, any> => {
    return useSnackQuery({
        queryFn: () => getZoomedInShapes({ bounds, category, params }),
        queryKey: ['lqasim-zoomin-map', bounds, category],
        options: {
            select: data => {
                if (!data) return [];
                return data.results;
            },
            enabled,
        },
    });
};

const getZoomedInBackgoundShapes = ({ bounds }) => {
    return getRequest(`/api/polio/lqasmap/zoominbackground/?bounds=${bounds}`);
};

export const useGetZoomedInBackgroundShapes = ({
    bounds,
    enabled,
}): UseQueryResult<any, any> => {
    return useSnackQuery({
        queryFn: () => getZoomedInBackgoundShapes({ bounds }),
        queryKey: ['lqasim-zoomin-map-bckgnd', bounds],
        options: {
            select: data => {
                if (!data) return [];
                return data.results;
            },
            enabled,
        },
    });
};
