import { FC, useEffect } from 'react';
import { MapLayerMouseEvent } from 'maplibre-gl';
import { useMap } from 'react-map-gl/maplibre';

type Props = {
    layerIds: string[];
    clickableOrgUnitIds: Set<number>;
    onClick: (orgUnitId: number) => void;
};

// Shows a pointer over the org units that react to a click.
export const ClickableOrgUnits: FC<Props> = ({
    layerIds,
    clickableOrgUnitIds,
    onClick,
}) => {
    const { current: mapRef } = useMap();

    useEffect(() => {
        const map = mapRef?.getMap();
        if (!map) return undefined;
        const getClickableId = (event: MapLayerMouseEvent) => {
            const orgUnitId = event.features?.[0]?.properties.id;
            return clickableOrgUnitIds.has(orgUnitId) ? orgUnitId : undefined;
        };
        const setCursor = (cursor: string) => {
            map.getCanvas().style.cursor = cursor;
        };
        const handleMove = (event: MapLayerMouseEvent) =>
            setCursor(getClickableId(event) === undefined ? '' : 'pointer');
        const handleLeave = () => setCursor('');
        const handleClick = (event: MapLayerMouseEvent) => {
            const orgUnitId = getClickableId(event);
            if (orgUnitId !== undefined) onClick(orgUnitId);
        };
        const subscriptions = [
            map.on('mousemove', layerIds, handleMove),
            map.on('mouseleave', layerIds, handleLeave),
            map.on('click', layerIds, handleClick),
        ];
        return () => {
            subscriptions.forEach(subscription => subscription.unsubscribe());
            handleLeave();
        };
    }, [mapRef, layerIds, clickableOrgUnitIds, onClick]);

    return null;
};
