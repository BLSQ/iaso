import React, { FC, useMemo } from 'react';
import { Theme, useTheme } from '@mui/material';
import { amber } from '@mui/material/colors';
import { FeatureCollection } from 'geojson';
import {
    CircleLayerSpecification,
    ExpressionSpecification,
    FillLayerSpecification,
    FilterSpecification,
    LineLayerSpecification,
} from 'maplibre-gl';
import { Layer, Source } from 'react-map-gl/maplibre';

const SOURCE_ID = 'assignableOrgUnits';
const FILL_LAYER_ID = `${SOURCE_ID}-fill`;
const CIRCLE_LAYER_ID = `${SOURCE_ID}-circle`;

export const FILL_OPACITY = 0.6;
const HOVER_FILL_OPACITY = 0.85;
const DIMMED_FILL_OPACITY = 0.15;
const DIMMED_CIRCLE_OPACITY = 0.25;
// The org unit found with "Find an org unit".
export const FOCUS_COLOR = amber[600];
export const getUnassignedColor = (theme: Theme): string =>
    theme.palette.grey[400];

export const ASSIGNABLE_ORG_UNITS_HOVER_LAYER_IDS = [
    FILL_LAYER_ID,
    CIRCLE_LAYER_ID,
];

// A circle layer otherwise draws a circle on every vertex of the shapes.
const isPoint: FilterSpecification = ['==', ['geometry-type'], 'Point'];

const isHovered: ExpressionSpecification = [
    'boolean',
    ['feature-state', 'hover'],
    false,
];

const orgUnitIdKey: ExpressionSpecification = ['to-string', ['get', 'id']];

// Styles by org unit id, so assignment changes never touch the geometry.
const getFillColor = (
    colorByOrgUnitId: ExpressionSpecification,
    unassignedColor: string,
): ExpressionSpecification => [
    'coalesce',
    ['get', orgUnitIdKey, colorByOrgUnitId],
    unassignedColor,
];

// Org unit ids are positive: -1 matches none.
export const getIsFocused = (
    focusedOrgUnitId?: number,
): ExpressionSpecification => ['==', ['get', 'id'], focusedOrgUnitId ?? -1];

export const FOCUS_LINE_PAINT: LineLayerSpecification['paint'] = {
    'line-color': FOCUS_COLOR,
    'line-width': 4,
};

const getIsDimmed = (
    undimmedOrgUnitIds?: Set<number>,
): ExpressionSpecification | false =>
    Boolean(undimmedOrgUnitIds) && [
        '!',
        ['in', ['get', 'id'], ['literal', [...(undimmedOrgUnitIds ?? [])]]],
    ];

type Props = {
    geoJson: FeatureCollection;
    colorByOrgUnitId: Map<number, string>;
    // Org units without a shape are drawn at their location.
    showPoints: boolean;
    dimAssigned: boolean;
    focusedOrgUnitId?: number;
    // When set, the other org units are dimmed.
    undimmedOrgUnitIds?: Set<number>;
};

export const AssignableOrgUnitsLayer: FC<Props> = ({
    geoJson,
    colorByOrgUnitId,
    showPoints,
    dimAssigned,
    focusedOrgUnitId,
    undimmedOrgUnitIds,
}) => {
    const theme = useTheme();
    const colorByOrgUnitIdLiteral: ExpressionSpecification = useMemo(
        () => ['literal', Object.fromEntries(colorByOrgUnitId)],
        [colorByOrgUnitId],
    );
    const isDimmed = useMemo(
        () => getIsDimmed(undimmedOrgUnitIds),
        [undimmedOrgUnitIds],
    );
    const fillColor = useMemo(
        () => getFillColor(colorByOrgUnitIdLiteral, getUnassignedColor(theme)),
        [colorByOrgUnitIdLiteral, theme],
    );
    const isDimmed: ExpressionSpecification | boolean = useMemo(
        () => dimAssigned && ['has', orgUnitIdKey, colorByOrgUnitIdLiteral],
        [colorByOrgUnitIdLiteral, dimAssigned],
    );
    const isFocused = useMemo(
        () => getIsFocused(focusedOrgUnitId),
        [focusedOrgUnitId],
    );
    const fillPaint: FillLayerSpecification['paint'] = useMemo(
        () => ({
            'fill-color': fillColor,
            'fill-opacity': [
                'case',
                isDimmed,
                DIMMED_FILL_OPACITY,
                isHovered,
                HOVER_FILL_OPACITY,
                FILL_OPACITY,
            ],
        }),
        [fillColor, isDimmed],
    );
    const circlePaint: CircleLayerSpecification['paint'] = useMemo(
        () => ({
            'circle-color': fillColor,
            'circle-radius': ['case', isHovered, 8, 6],
            'circle-stroke-color': [
                'case',
                isFocused,
                FOCUS_COLOR,
                theme.palette.common.white,
            ],
            'circle-stroke-width': ['case', isFocused, 4, 2],
            'circle-opacity': ['case', isDimmed, DIMMED_CIRCLE_OPACITY, 1],
        }),
        [fillColor, isDimmed, isFocused, theme.palette.common.white],
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
                id={`${SOURCE_ID}-focus`}
                type="line"
                filter={isFocused}
                paint={FOCUS_LINE_PAINT}
            />
            <Layer
                id={CIRCLE_LAYER_ID}
                type="circle"
                filter={isPoint}
                paint={circlePaint}
                layout={{ visibility: showPoints ? 'visible' : 'none' }}
            />
        </Source>
    );
};
