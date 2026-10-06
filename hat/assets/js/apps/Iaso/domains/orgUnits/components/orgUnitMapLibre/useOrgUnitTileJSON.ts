import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQueries, useSnackQuery } from 'Iaso/libs/apiHooks';
import MESSAGES from '../../messages';
import {
    OrgUnitTilesFilters,
    TileJSON,
    orgUnitTileJSONUrl,
} from './orgUnitTiles';
import { useOrgUnitTilesCacheKey } from './useOrgUnitTilesCacheKey';

/**
 * The TileJSON of the org unit tiles matching `filters`: their url, zoom range and bounds - all a map needs to
 * draw them on its own. Under the tiles' cache key: invalidating it refetches both.
 */
export const useOrgUnitTileJSON = (
    filters: OrgUnitTilesFilters,
    enabled = true,
): UseQueryResult<TileJSON> => {
    const cacheKey = useOrgUnitTilesCacheKey();
    const url = orgUnitTileJSONUrl({ ...filters, cache_key: cacheKey });
    return useSnackQuery(
        ['orgUnitTileJSON', url],
        () => getRequest(url),
        MESSAGES.fetchOrgUnitError,
        { enabled },
    );
};

/** `useOrgUnitTileJSON` for several queries at once, e.g. one per search: results in the same order */
export const useOrgUnitTileJSONs = (
    filtersList: OrgUnitTilesFilters[],
    enabled = true,
): UseQueryResult<TileJSON>[] => {
    const cacheKey = useOrgUnitTilesCacheKey();
    return useSnackQueries<TileJSON[]>(
        filtersList.map(filters => {
            const url = orgUnitTileJSONUrl({ ...filters, cache_key: cacheKey });
            return {
                queryKey: ['orgUnitTileJSON', url],
                queryFn: () => getRequest(url),
                snackErrorMsg: MESSAGES.fetchOrgUnitError,
                dispatchOnError: true,
                options: { enabled, staleTime: Infinity },
            };
        }),
    );
};
