import React, { FunctionComponent, useMemo } from 'react';
import { Layer, Source } from '@vis.gl/react-maplibre';
import type { GeoJSON } from 'geojson';
import { geometryLayers } from './geometryLayers';

type Props = {
    id: string;
    data: GeoJSON;
    color: string;
};

/** Client-side GeoJSON (e.g. from React state) drawn in a single color */
export const GeoJsonLayer: FunctionComponent<Props> = ({ id, data, color }) => {
    const layers = useMemo(
        () => geometryLayers(id, { color, fillOpacity: 0.3, lineWidth: 3 }),
        [id, color],
    );
    return (
        <Source id={id} type="geojson" data={data}>
            {layers.map(layer => (
                <Layer key={layer.id} {...layer} />
            ))}
        </Source>
    );
};
