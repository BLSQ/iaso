import React, { FC, useMemo } from 'react';
import { useTheme } from '@mui/material';
import { FeatureCollection } from 'geojson';
import {
    ExpressionSpecification,
    FillLayerSpecification,
    LineLayerSpecification,
} from 'maplibre-gl';
import { Layer, Source } from 'react-map-gl/maplibre';

const SOURCE_ID = 'assignableOrgUnits';

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
};

export const AssignableOrgUnitsLayer: FC<Props> = ({
    geoJson,
    colorByOrgUnitId,
}) => {
    const theme = useTheme();
    const fillPaint: FillLayerSpecification['paint'] = useMemo(
        () => ({
            'fill-color': getFillColor(
                colorByOrgUnitId,
                theme.palette.grey[400],
            ),
            'fill-opacity': 0.6,
        }),
        [colorByOrgUnitId, theme.palette.grey],
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
            <Layer id={`${SOURCE_ID}-fill`} type="fill" paint={fillPaint} />
            <Layer id={`${SOURCE_ID}-line`} type="line" paint={linePaint} />
        </Source>
    );
};
