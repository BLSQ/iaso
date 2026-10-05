/** `TILE_LAYER` of `iaso/api/v3/org_units/views.py`: the `source-layer` of every org unit tile */
export const ORG_UNIT_TILES_SOURCE_LAYER = 'org_units';

/** Any filter of `/api/v3/orgunits/` (e.g. `parent_id`, `version_id`, `org_unit_type_id`, `fields`) */
export type OrgUnitTilesFilters = Record<
    string,
    string | number | boolean | undefined
>;

/**
 * The `{z}/{x}/{y}` url template of `/api/v3/orgunits/tiles/`, for a vector `<Source>`.
 * Absolute, like the MVT playground: MapLibre fetches tiles from web workers.
 */
export const orgUnitTilesUrl = (
    filters: OrgUnitTilesFilters,
    origin: string = window.location.origin,
): string => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
            params.set(key, String(value));
        }
    });
    // keep the commas of `fields=` readable in the network tab
    const query = params.toString().replaceAll('%2C', ',');
    return `${origin}/api/v3/orgunits/tiles/{z}/{x}/{y}/${query ? `?${query}` : ''}`;
};
