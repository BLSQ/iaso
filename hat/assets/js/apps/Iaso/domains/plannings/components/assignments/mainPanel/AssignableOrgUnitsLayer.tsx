import React, { FC, useMemo } from 'react';
import { Theme, useTheme } from '@mui/material';
import { FeatureCollection } from 'geojson';
import {
    CircleLayerSpecification,
    ExpressionSpecification,
    FillLayerSpecification,
    LineLayerSpecification,
} from 'maplibre-gl';
import { Layer, Source } from 'react-map-gl/maplibre';

const SOURCE_ID = 'assignableOrgUnits';
const FILL_LAYER_ID = `${SOURCE_ID}-fill`;
const CIRCLE_LAYER_ID = `${SOURCE_ID}-circle`;

export const FILL_OPACITY = 0.6;
export const getUnassignedColor = (theme: Theme): string =>
    theme.palette.grey[400];

export const ASSIGNABLE_ORG_UNITS_HOVER_LAYER_IDS = [
    FILL_LAYER_ID,
    CIRCLE_LAYER_ID,
];

// Styles by org unit id, so assignment changes never touch the geometry.
const getFillColor = (
    colorByOrgUnitId: Map<number, string>,
    unassignedColor: string,
): ExpressionSpecification => [
    'coalesce',
    [
        'get',
        ['to-string', ['get', 'id']],
        ['literal', Object.fromEntries(colorByOrgUnitId)],
    ],
    unassignedColor,
];

type Props = {
    geoJson: FeatureCollection;
    colorByOrgUnitId: Map<number, string>;
    // Org units without a shape are drawn at their location.
    showPoints: boolean;
};

export const AssignableOrgUnitsLayer: FC<Props> = ({
    geoJson,
    colorByOrgUnitId,
    showPoints,
}) => {
    const theme = useTheme();
    const fillColor = useMemo(
        () => getFillColor(colorByOrgUnitId, getUnassignedColor(theme)),
        [colorByOrgUnitId, theme],
    );
    const fillPaint: FillLayerSpecification['paint'] = useMemo(
        () => ({ 'fill-color': fillColor, 'fill-opacity': FILL_OPACITY }),
        [fillColor],
    );
    const circlePaint: CircleLayerSpecification['paint'] = useMemo(
        () => ({
            'circle-color': fillColor,
            'circle-radius': 6,
            'circle-stroke-color': theme.palette.common.white,
            'circle-stroke-width': 2,
        }),
        [fillColor, theme.palette.common.white],
    );
    const linePaint: LineLayerSpecification['paint'] = useMemo(
        () => ({
            'line-color': theme.palette.common.white,
            'line-width': 2,
        }),
        [theme.palette.common.white],
    );
    return (
        <Source id={SOURCE_ID} type="geojson" data={geoJson}>
            <Layer id={FILL_LAYER_ID} type="fill" paint={fillPaint} />
            <Layer id={`${SOURCE_ID}-line`} type="line" paint={linePaint} />
            <Layer
                id={CIRCLE_LAYER_ID}
                type="circle"
                paint={circlePaint}
                layout={{ visibility: showPoints ? 'visible' : 'none' }}
            />
        </Source>
    );
};
