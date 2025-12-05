import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { makeUrlWithParams } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/utils';
import { AfroMapParams, MapCategory, RoundSelection } from '../types';
import { appId } from '../../../../../constants/app';
import { Side } from '../../../../../constants/types';

type GetAfroMapDataArgs = {
    category: MapCategory;
    params: Partial<AfroMapParams> & { accountId: string };
    selectedRound: RoundSelection;
    isEmbedded: boolean;
};
const getAfroMapData = ({
    category,
    params,
    selectedRound,
    isEmbedded,
}: GetAfroMapDataArgs) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accountId, ...apiParams } = params;
    (apiParams as Record<string, string | number>).category = category;
    (apiParams as Record<string, string | number>).round = selectedRound;
    if (isEmbedded) {
        (apiParams as Record<string, string | number>).app_id = appId;
    }
    const baseUrl = `/api/polio/lqasmap/global/`;
    const url = makeUrlWithParams(baseUrl, apiParams);
    return getRequest(url);
};
type UseAfroMapShapesArgs = {
    category: MapCategory;
    enabled: boolean;
    params: AfroMapParams & { accountId: string };
    selectedRound: RoundSelection;
    side: Side;
    isEmbedded: boolean;
};
export const useAfroMapShapes = ({
    category,
    enabled,
    params,
    selectedRound,
    side,
    isEmbedded,
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
            getAfroMapData({
                category,
                params: queryKeyParams,
                selectedRound,
                isEmbedded,
            }),
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
    params: Partial<AfroMapParams> & { accountId: string };
    selectedRound: RoundSelection;
    bounds: string; // stringified object : {_northEast:{lat:number,lng:number},_southWest:{lat:number,lng:number}}
    isEmbedded: boolean;
};

const getZoomedInShapes = ({
    bounds,
    category,
    params,
    selectedRound,
    isEmbedded,
}: GetZoomedInShapesArgs) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accountId, ...apiParams } = params;
    (apiParams as Record<string, string | number>).category = category;
    (apiParams as Record<string, string | number>).bounds = bounds;
    (apiParams as Record<string, string | number>).round = selectedRound;
    if (isEmbedded) {
        (apiParams as Record<string, string | number>).app_id = appId;
    }
    const baseUrl = `/api/polio/lqasmap/zoomin/`;
    const url = makeUrlWithParams(baseUrl, apiParams);
    return getRequest(url);
};
type UseGetZoomedInShapesArgs = {
    enabled: boolean;
    category: MapCategory;
    params: AfroMapParams & { accountId: string };
    selectedRound: RoundSelection;
    bounds: string; // stringified object : {_northEast:{lat:number,lng:number},_southWest:{lat:number,lng:number}}
    side: Side;
    isEmbedded: boolean;
};

export const useGetZoomedInShapes = ({
    bounds,
    category,
    enabled,
    params,
    selectedRound,
    side,
    isEmbedded,
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
                isEmbedded,
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
    isEmbedded: boolean;
};

const getZoomedInBackgoundShapes = ({
    bounds,
    isEmbedded,
}: GetZoomedInBackgoundShapesArgs) => {
    const url = isEmbedded
        ? `/api/polio/lqasmap/zoominbackground/?bounds=${bounds}&app_id=${appId}`
        : `/api/polio/lqasmap/zoominbackground/?bounds=${bounds}`;
    return getRequest(url);
};

type UseGetZoomedInBackgoundShapesArgs = {
    bounds: string; // stringified object : {_northEast:{lat:number,lng:number},_southWest:{lat:number,lng:number}}
    enabled: boolean;
    isEmbedded: boolean;
};

export const useGetZoomedInBackgroundShapes = ({
    bounds,
    isEmbedded,
    enabled,
}: UseGetZoomedInBackgoundShapesArgs): UseQueryResult<any, any> => {
    return useSnackQuery({
        queryFn: () => getZoomedInBackgoundShapes({ bounds, isEmbedded }),
        queryKey: ['lqasim-zoomin-map-bckgnd', bounds],
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
