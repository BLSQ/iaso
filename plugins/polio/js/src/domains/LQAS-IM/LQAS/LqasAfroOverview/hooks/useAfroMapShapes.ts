import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { makeUrlWithParams } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/utils';
import { AfroMapParams, MapCategory, RoundSelection } from '../types';

type GetAfroMapDataArgs = {
    category: MapCategory;
    params: AfroMapParams;
    selectedRound: RoundSelection;
};
const getAfroMapData = ({
    category,
    params,
    selectedRound,
}: GetAfroMapDataArgs) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accountId, ...apiParams } = params;
    (apiParams as Record<string, string | number>).category = category;
    (apiParams as Record<string, string | number>).round = selectedRound;
    const baseUrl = `/api/polio/lqasmap/global/`;
    const url = makeUrlWithParams(baseUrl, apiParams);
    return getRequest(url);
};
type UseAfroMapShapesArgs = {
    category: MapCategory;
    enabled: boolean;
    params: AfroMapParams;
    selectedRound: RoundSelection;
    side: 'left' | 'right';
};
export const useAfroMapShapes = ({
    category,
    enabled,
    params,
    selectedRound,
    side,
}: UseAfroMapShapesArgs): UseQueryResult<any, any> => {
    const queryKeyParams = {
        rounds: params.rounds,
        startDate: params.startDate,
        endDate: params.endDate,
        period: params.period,
        accountId: params.accountId,
    };
    return useSnackQuery({
        queryFn: () =>
            getAfroMapData({ category, params: queryKeyParams, selectedRound }),
        queryKey: [
            'lqasim-afro-map',
            category,
            queryKeyParams,
            selectedRound,
            side,
        ],
        options: {
            select: data => {
                if (!data) return [];
                return data.results;
            },
            enabled,
            keepPreviousData: true,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    });
};

type GetZoomedInShapesArgs = {
    category: MapCategory;
    params: AfroMapParams;
    selectedRound: RoundSelection;
    bounds: string; // stringified object : {_northEast:{lat:number,lng:number},_southWest:{lat:number,lng:number}}
};

const getZoomedInShapes = ({
    bounds,
    category,
    params,
    selectedRound,
}: GetZoomedInShapesArgs) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accountId, ...apiParams } = params;
    (apiParams as Record<string, string | number>).category = category;
    (apiParams as Record<string, string | number>).bounds = bounds;
    (apiParams as Record<string, string | number>).round = selectedRound;
    const baseUrl = `/api/polio/lqasmap/zoomin/`;
    const url = makeUrlWithParams(baseUrl, apiParams);
    return getRequest(url);
};
type UseGetZoomedInShapesArgs = {
    enabled: boolean;
    category: MapCategory;
    params: AfroMapParams;
    selectedRound: RoundSelection;
    bounds: string; // stringified object : {_northEast:{lat:number,lng:number},_southWest:{lat:number,lng:number}}
    side: 'left' | 'right';
};

export const useGetZoomedInShapes = ({
    bounds,
    category,
    enabled,
    params,
    selectedRound,
    side,
}: UseGetZoomedInShapesArgs): UseQueryResult<any, any> => {
    const queryKeyParams = {
        rounds: params.rounds,
        startDate: params.startDate,
        endDate: params.endDate,
        period: params.period,
        accountId: params.accountId,
    };
    return useSnackQuery({
        queryFn: () =>
            getZoomedInShapes({
                bounds,
                category,
                params: queryKeyParams,
                selectedRound,
            }),
        queryKey: [
            'lqasim-zoomin-map',
            bounds,
            category,
            queryKeyParams,
            selectedRound,
            side,
        ],
        options: {
            select: data => {
                if (!data) return [];
                return data.results;
            },
            enabled,
            keepPreviousData: true,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    });
};

type GetZoomedInBackgoundShapesArgs = {
    bounds: string; // stringified object : {_northEast:{lat:number,lng:number},_southWest:{lat:number,lng:number}}
};

const getZoomedInBackgoundShapes = ({
    bounds,
}: GetZoomedInBackgoundShapesArgs) => {
    return getRequest(`/api/polio/lqasmap/zoominbackground/?bounds=${bounds}`);
};

type UseGetZoomedInBackgoundShapesArgs = {
    bounds: string; // stringified object : {_northEast:{lat:number,lng:number},_southWest:{lat:number,lng:number}}
    enabled: boolean;
};

export const useGetZoomedInBackgroundShapes = ({
    bounds,
    enabled,
}: UseGetZoomedInBackgoundShapesArgs): UseQueryResult<any, any> => {
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
