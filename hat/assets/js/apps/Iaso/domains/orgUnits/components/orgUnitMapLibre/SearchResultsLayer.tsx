import React, { FunctionComponent, useMemo } from 'react';
import { Layer, Source } from '@vis.gl/react-maplibre';
import { TileJSON } from './orgUnitTiles';
import { searchResultsLayers, SearchStyle } from './searchResultsLayers';

type Props = SearchStyle & {
    id: string;
    tileJSON: TileJSON;
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
    filter,
    shapeSortKey,
}) => {
    // filters and colors change without a new source: no tile is fetched again
    const layers = useMemo(
        () =>
            searchResultsLayers(id, { color, clusters, filter, shapeSortKey }),
        [id, color, clusters, filter, shapeSortKey],
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
