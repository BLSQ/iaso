import React, { FunctionComponent, useMemo } from 'react';
import { Layer, Source } from '@vis.gl/react-maplibre';
import { TileJSON } from './orgUnitTiles';
import { searchResultsLayers } from './searchResultsLayers';

type Props = {
    id: string;
    tileJSON: TileJSON;
    color: string;
    clusters: boolean;
};

/**
 * The org units of one search, from the vector tiles its TileJSON describes. Its layers are slotted under the
 * anchor layers (see `anchorLayers`), so all the searches' shapes stay under all their points.
 */
export const SearchResultsLayer: FunctionComponent<Props> = ({
    id,
    tileJSON,
    color,
    clusters,
}) => {
    const layers = useMemo(
        () => searchResultsLayers(id, color, clusters),
        [id, color, clusters],
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
