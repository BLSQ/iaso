import React, { FC, useMemo } from 'react';
import { useTheme } from '@mui/material';
import { FeatureCollection } from 'geojson';
import { Layer, LineLayerSpecification, Source } from 'react-map-gl/maplibre';
import { FOCUS_LINE_PAINT, getIsFocused } from './AssignableOrgUnitsLayer';

export const SCOPE_AREA_LAYER_ID = 'scopeArea';

type Props = {
    geoJson: FeatureCollection;
    // The planning root, found with "Find an org unit", is the area of the root team.
    focusedOrgUnitId?: number;
};

export const ScopeAreaLayer: FC<Props> = ({ geoJson, focusedOrgUnitId }) => {
    const theme = useTheme();
    const paint: LineLayerSpecification['paint'] = useMemo(
        () => ({ 'line-color': theme.palette.primary.main, 'line-width': 3 }),
        [theme.palette.primary.main],
    );
    const isFocused = useMemo(
        () => getIsFocused(focusedOrgUnitId),
        [focusedOrgUnitId],
    );
    return (
        <Source id={SCOPE_AREA_LAYER_ID} type="geojson" data={geoJson}>
            <Layer id={SCOPE_AREA_LAYER_ID} type="line" paint={paint} />
            <Layer
                id={`${SCOPE_AREA_LAYER_ID}-focus`}
                type="line"
                filter={isFocused}
                paint={FOCUS_LINE_PAINT}
            />
        </Source>
    );
};
