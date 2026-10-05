import React, { FunctionComponent, useMemo } from 'react';
import { Layer, Source } from '@vis.gl/react-maplibre';
import { geometryLayers } from '../../../../components/maps/maplibre';
import {
    ORG_UNIT_TILES_SOURCE_LAYER,
    OrgUnitTilesFilters,
    orgUnitTilesUrl,
} from './orgUnitTiles';

type Props = {
    id: string;
    filters: OrgUnitTilesFilters;
    color: string;
};

/**
 * Org units streamed as vector tiles from `/api/v3/orgunits/tiles/`, filtered server side.
 * The MVT feature id is the org unit id: `event.features[0].id` in click handlers.
 */
export const OrgUnitTilesLayer: FunctionComponent<Props> = ({
    id,
    filters,
    color,
}) => {
    const filtersKey = JSON.stringify(filters);
    const tilesUrl = useMemo(
        () => orgUnitTilesUrl(filters),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [filtersKey],
    );
    const layers = useMemo(
        () =>
            geometryLayers(id, {
                color,
                sourceLayer: ORG_UNIT_TILES_SOURCE_LAYER,
            }),
        [id, color],
    );
    return (
        // tiles are generated up to z14, MapLibre overzooms them past it
        <Source id={id} type="vector" tiles={[tilesUrl]} maxzoom={14}>
            {layers.map(layer => (
                <Layer key={layer.id} {...layer} />
            ))}
        </Source>
    );
};
