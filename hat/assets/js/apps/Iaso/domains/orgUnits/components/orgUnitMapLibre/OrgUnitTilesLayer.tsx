import React, { FunctionComponent, useMemo } from 'react';
import { Layer, Source } from '@vis.gl/react-maplibre';
import {
    GeometryStyle,
    geometryLayers,
} from '../../../../components/maps/maplibre';
import { ORG_UNIT_TILES_SOURCE_LAYER, TileJSON } from './orgUnitTiles';

type Props = GeometryStyle & {
    id: string;
    /** from `useOrgUnitTileJSON` */
    tileJSON: TileJSON;
};

/**
 * Org units streamed as vector tiles from `/api/v3/orgunits/tiles/`, as their TileJSON describes them: its
 * `bounds` spare the requests of the tiles outside. The MVT feature id is the org unit id
 * (`event.features[0].id` in click handlers).
 */
export const OrgUnitTilesLayer: FunctionComponent<Props> = ({
    id,
    tileJSON,
    color,
    fillOpacity,
    lineWidth,
}) => {
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
            tiles={tileJSON.tiles}
            bounds={tileJSON.bounds}
            minzoom={tileJSON.minzoom}
            maxzoom={tileJSON.maxzoom}
        >
            {layers.map(layer => (
                <Layer key={layer.id} {...layer} />
            ))}
        </Source>
    );
};
