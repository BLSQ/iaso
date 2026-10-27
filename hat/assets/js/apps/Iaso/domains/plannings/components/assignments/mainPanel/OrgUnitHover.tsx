import React, { FC, useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { LngLat, MapGeoJSONFeature, MapLayerMouseEvent } from 'maplibre-gl';
import { Popup, useMap } from 'react-map-gl/maplibre';
import { SxStyles } from 'Iaso/types/general';

const styles = {
    name: { fontWeight: 500 },
} satisfies SxStyles;

type HoveredOrgUnit = {
    lngLat: LngLat;
    name: string;
};

type Props = {
    layerIds: string[];
};

// Highlights the hovered org unit through its `hover` feature state, and shows its name.
export const OrgUnitHover: FC<Props> = ({ layerIds }) => {
    const { current: mapRef } = useMap();
    const [hovered, setHovered] = useState<HoveredOrgUnit>();

    useEffect(() => {
        const map = mapRef?.getMap();
        if (!map) return undefined;
        let highlighted: MapGeoJSONFeature | undefined;
        const setHighlighted = (feature?: MapGeoJSONFeature) => {
            if (highlighted?.id === feature?.id) return;
            if (highlighted) map.setFeatureState(highlighted, { hover: false });
            if (feature) map.setFeatureState(feature, { hover: true });
            highlighted = feature;
        };
        const handleMove = (event: MapLayerMouseEvent) => {
            const feature = event.features?.[0];
            setHighlighted(feature);
            setHovered(
                feature && {
                    lngLat: event.lngLat,
                    name: feature.properties.name,
                },
            );
        };
        const handleLeave = () => {
            setHighlighted(undefined);
            setHovered(undefined);
        };
        const subscriptions = [
            map.on('mousemove', layerIds, handleMove),
            map.on('mouseleave', layerIds, handleLeave),
        ];
        return () => {
            subscriptions.forEach(subscription => subscription.unsubscribe());
            handleLeave();
        };
    }, [mapRef, layerIds]);

    if (!hovered) return null;
    return (
        <Popup
            longitude={hovered.lngLat.lng}
            latitude={hovered.lngLat.lat}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={12}
        >
            <Typography variant="body2" sx={styles.name}>
                {hovered.name}
            </Typography>
        </Popup>
    );
};
