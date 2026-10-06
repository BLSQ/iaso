import { Bounds } from '../../../../components/maps/maplibre';

/** `TILE_LAYER` of `iaso/api/v3/org_units/views.py`: the `source-layer` of every org unit tile */
export const ORG_UNIT_TILES_SOURCE_LAYER = 'org_units';

/** react-query key of the tiles' `cache_key`: invalidate it when org units change (see `useOrgUnitTilesCacheKey`) */
export const ORG_UNIT_TILES_CACHE_KEY = 'orgUnitTilesCacheKey';

/** Any filter of `/api/v3/orgunits/` (e.g. `parent_id`, `version_id`, `org_unit_type_id`, `fields`) */
export type OrgUnitTilesFilters = Record<
    string,
    string | number | boolean | undefined
>;

/** What `/api/v3/orgunits/tilejson/` says about the tiles of a query (TileJSON 3.0.0) */
export type TileJSON = {
    tilejson: string;
    /** the tile url template, absolute: MapLibre fetches tiles from web workers */
    tiles: string[];
    minzoom: number;
    maxzoom: number;
    /** `[west, south, east, north]`, left out when none of the org units is located */
    bounds?: [number, number, number, number];
    vector_layers: { id: string; fields: Record<string, string> }[];
    /** how many org units match, located or not */
    count: number;
    /** how many of them are on the map */
    located_count: number;
    /** where to look: `bounds` without the far outliers, left out when none is located */
    fit_bounds?: [number, number, number, number];
    /** how many located org units `fit_bounds` leaves out */
    outside_fit_bounds: number;
};

/** The TileJSON of the org unit tiles matching `filters` */
export const orgUnitTileJSONUrl = (filters: OrgUnitTilesFilters): string => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
            params.set(key, String(value));
        }
    });
    // keep the commas of `fields=` readable in the network tab
    const query = params.toString().replaceAll('%2C', ',');
    return `/api/v3/orgunits/tilejson/${query ? `?${query}` : ''}`;
};

/** TileJSON `bounds` (or `fit_bounds`) as MapLibre's `[[west, south], [east, north]]` */
export const tileJSONBounds = (
    tileJSON: TileJSON,
    key: 'bounds' | 'fit_bounds' = 'bounds',
): Bounds | undefined => {
    const bounds = tileJSON[key];
    return (
        bounds && [
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]],
        ]
    );
};
