import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const getAfroMapData = ({ category, round }) => {
    return getRequest(
        `/api/polio/lqasmap/global/?category=${category}&round=${round}`,
    );
};

export const useAfroMapShapes = ({
    category,
    enabled,
    round,
}): UseQueryResult<any, any> => {
    return useSnackQuery({
        queryFn: () => getAfroMapData({ category, round }),
        queryKey: ['lqasim-afro-map', category, round],
        options: {
            select: data => {
                if (!data) return [];
                return data.results;
            },
            enabled,
        },
    });
};

const getZoomedInShapes = ({ bounds, category, round }) => {
    return getRequest(
        `/api/polio/lqasmap/zoomin/?category=${category}&bounds=${bounds}&round=${round}`,
    );
};

export const useGetZoomedInShapes = ({
    bounds,
    category,
    enabled,
    round,
}): UseQueryResult<any, any> => {
    return useSnackQuery({
        queryFn: () => getZoomedInShapes({ bounds, category, round }),
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
