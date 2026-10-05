import React, { FunctionComponent, useMemo } from 'react';
import { Layer, Source } from '@vis.gl/react-maplibre';
import type { GeoJSON } from 'geojson';
import { GeometryStyle, geometryLayers } from './geometryLayers';

type Props = GeometryStyle & {
    id: string;
    data: GeoJSON;
};

/** Client-side GeoJSON (e.g. from React state) drawn in a single color */
export const GeoJsonLayer: FunctionComponent<Props> = ({
    id,
    data,
    color,
    fillOpacity,
    lineWidth,
}) => {
    const layers = useMemo(
        () => geometryLayers(id, { color, fillOpacity, lineWidth }),
        [id, color, fillOpacity, lineWidth],
    );
    return (
        <Source id={id} type="geojson" data={data}>
            {layers.map(layer => (
                <Layer key={layer.id} {...layer} />
            ))}
        </Source>
    );
};
