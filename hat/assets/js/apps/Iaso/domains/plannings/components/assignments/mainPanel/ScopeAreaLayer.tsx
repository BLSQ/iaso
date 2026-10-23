import React, { FC, useMemo } from 'react';
import { useTheme } from '@mui/material';
import { FeatureCollection } from 'geojson';
import { Layer, LineLayerSpecification, Source } from 'react-map-gl/maplibre';

export const SCOPE_AREA_LAYER_ID = 'scopeArea';

type Props = {
    geoJson: FeatureCollection;
};

export const ScopeAreaLayer: FC<Props> = ({ geoJson }) => {
    const theme = useTheme();
    const paint: LineLayerSpecification['paint'] = useMemo(
        () => ({ 'line-color': theme.palette.primary.main, 'line-width': 3 }),
        [theme.palette.primary.main],
    );
    return (
        <Source id={SCOPE_AREA_LAYER_ID} type="geojson" data={geoJson}>
            <Layer id={SCOPE_AREA_LAYER_ID} type="line" paint={paint} />
        </Source>
    );
};
