import React, { FC, useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { LngLat, MapLayerMouseEvent } from 'maplibre-gl';
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

export const OrgUnitTooltip: FC<Props> = ({ layerIds }) => {
    const { current: mapRef } = useMap();
    const [hovered, setHovered] = useState<HoveredOrgUnit>();

    useEffect(() => {
        const map = mapRef?.getMap();
        if (!map) return undefined;
        const handleMove = (event: MapLayerMouseEvent) => {
            const feature = event.features?.[0];
            setHovered(
                feature && {
                    lngLat: event.lngLat,
                    name: feature.properties.name,
                },
            );
        };
        const handleLeave = () => setHovered(undefined);
        const subscriptions = [
            map.on('mousemove', layerIds, handleMove),
            map.on('mouseleave', layerIds, handleLeave),
        ];
        return () =>
            subscriptions.forEach(subscription => subscription.unsubscribe());
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
