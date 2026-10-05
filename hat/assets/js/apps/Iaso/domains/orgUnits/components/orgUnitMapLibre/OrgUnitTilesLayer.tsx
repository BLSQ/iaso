import React, { FunctionComponent, useMemo } from 'react';
import { Layer, Source } from '@vis.gl/react-maplibre';
import {
    GeometryStyle,
    geometryLayers,
} from '../../../../components/maps/maplibre';
import {
    ORG_UNIT_TILES_SOURCE_LAYER,
    OrgUnitTilesFilters,
    orgUnitTilesUrl,
} from './orgUnitTiles';
import { useOrgUnitTilesCacheKey } from './useOrgUnitTilesCacheKey';

// Tiles are simplified for their zoom, up to the full shapes: overzooming past this only shows half a meter
// rounding, while each zoom level more is 4 times more tile requests for the same area.
const TILES_MAX_ZOOM = 18;

type Props = GeometryStyle & {
    id: string;
    filters: OrgUnitTilesFilters;
};

/**
 * Org units streamed as vector tiles from `/api/v3/orgunits/tiles/`, filtered server side, and kept by the
 * browser as long as the `useOrgUnitTilesCacheKey` key.
 * The MVT feature id is the org unit id: `event.features[0].id` in click handlers.
 */
export const OrgUnitTilesLayer: FunctionComponent<Props> = ({
    id,
    filters,
    color,
    fillOpacity,
    lineWidth,
}) => {
    const cacheKey = useOrgUnitTilesCacheKey();
    const filtersKey = JSON.stringify(filters);
    const tilesUrl = useMemo(
        () => orgUnitTilesUrl({ ...filters, cache_key: cacheKey }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [filtersKey, cacheKey],
    );
    const layers = useMemo(
        () =>
            geometryLayers(id, {
                color,
                fillOpacity,
                lineWidth,
                sourceLayer: ORG_UNIT_TILES_SOURCE_LAYER,
            }),
        [id, color, fillOpacity, lineWidth],
    );
    return (
        <Source
            id={id}
            type="vector"
            tiles={[tilesUrl]}
            maxzoom={TILES_MAX_ZOOM}
        >
            {layers.map(layer => (
                <Layer key={layer.id} {...layer} />
            ))}
        </Source>
    );
};
