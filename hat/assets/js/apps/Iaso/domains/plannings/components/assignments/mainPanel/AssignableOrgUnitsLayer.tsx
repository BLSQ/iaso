import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTheme } from '@mui/material';
import { Feature } from 'geojson';
import L from 'leaflet';
import { GeoJSON } from 'react-leaflet';
import { AssignableOrgUnit, OrgUnitFeatureProperties } from './types';
import { toFeatureCollection } from './utils';

type Props = {
    orgUnits: AssignableOrgUnit[];
    colorByOrgUnitId: Map<number, string>;
};

export const AssignableOrgUnitsLayer: FC<Props> = ({
    orgUnits,
    colorByOrgUnitId,
}) => {
    const theme = useTheme();
    const layerRef = useRef<L.GeoJSON>(null);
    const featureCollection = useMemo(
        () => toFeatureCollection(orgUnits),
        [orgUnits],
    );

    const getStyle = useCallback(
        (feature?: Feature): L.PathOptions => {
            const { id } = (feature?.properties ??
                {}) as OrgUnitFeatureProperties;
            const color = colorByOrgUnitId.get(id);
            return {
                color: theme.palette.common.white,
                weight: 2,
                fillColor: color ?? theme.palette.grey[400],
                fillOpacity: color ? 0.62 : 0.5,
            };
        },
        [colorByOrgUnitId, theme],
    );

    // react-leaflet only reads data on mount, and types `style` as CSS: update the layer in place.
    const getStyleRef = useRef(getStyle);
    getStyleRef.current = getStyle;
    useEffect(() => {
        layerRef.current
            ?.clearLayers()
            .addData(featureCollection)
            .setStyle(getStyleRef.current);
    }, [featureCollection]);
    useEffect(() => {
        layerRef.current?.setStyle(getStyle);
    }, [getStyle]);

    return <GeoJSON ref={layerRef} data={featureCollection} />;
};
