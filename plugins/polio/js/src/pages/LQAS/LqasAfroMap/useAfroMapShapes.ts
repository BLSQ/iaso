import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const getAfroMapData = category => {
    return getRequest(`/api/polio/lqasmap/global/?category=${category}`);
};

export const useAfroMapShapes = (
    category = 'lqas',
): UseQueryResult<any, any> => {
    return useSnackQuery({
        queryFn: () => getAfroMapData(category),
        queryKey: ['lqasim-afro-map', category],
        options: {
            select: data => {
                if (!data) return [];
                return data.results;
            },
        },
    });
};

const getZoomedInShapes = (bounds: string, category: string) => {
    // return getRequest(
    //     `/api/polio/lqasmap/zoomin/?category=${category}&bounds=${bounds}`,
    // );
    console.log('SEND BOUNDS', bounds);
    return getRequest(`/api/polio/lqasmap/global/?category=${category}`);
};

export const useGetZoomedInShapes = (
    bounds: string,
    category: string,
    enabled: boolean,
): UseQueryResult<any, any> => {
    return useSnackQuery({
        queryFn: () => getZoomedInShapes(bounds, category),
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
