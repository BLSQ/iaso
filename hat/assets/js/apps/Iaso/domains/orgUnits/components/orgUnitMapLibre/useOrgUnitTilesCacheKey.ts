import { useQuery } from 'react-query';
import { ORG_UNIT_TILES_CACHE_KEY } from './orgUnitTiles';

// `TILE_CACHE_MAX_AGE` of iaso/api/v3/common/mvt.py: how long the browser may reuse a tile with a `cache_key`
const TILES_MAX_AGE_MS = 15 * 60 * 1000;

const newKey = () => Math.random().toString(36).slice(2, 10);

/**
 * The `cache_key` of the org unit tile urls, which lets the browser reuse tiles the way react-query reuses
 * query data. It is itself a query, so it behaves like one: a new key - new urls, fresh tiles - when it's
 * invalidated (the org unit page does it on save) or once stale (the next mount after 15 minutes - the app
 * turns off refetching on window focus). Not persisted: a page reload starts with a new key.
 */
export const useOrgUnitTilesCacheKey = (): string =>
    useQuery([ORG_UNIT_TILES_CACHE_KEY], newKey, {
        staleTime: TILES_MAX_AGE_MS,
        cacheTime: TILES_MAX_AGE_MS,
        // available on the first render: no tile is requested without it
        initialData: newKey,
    }).data as string;
