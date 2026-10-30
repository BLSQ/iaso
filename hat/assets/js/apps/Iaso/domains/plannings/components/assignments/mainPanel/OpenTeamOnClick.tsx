import { FC, useEffect } from 'react';
import { MapLayerMouseEvent } from 'maplibre-gl';
import { useMap } from 'react-map-gl/maplibre';

type Props = {
    layerIds: string[];
    teamIdByOrgUnitId: Map<number, number>;
    onOpenTeam: (teamId: number) => void;
};

// Org units assigned to a sub-team open it on click, and show a pointer to say so.
export const OpenTeamOnClick: FC<Props> = ({
    layerIds,
    teamIdByOrgUnitId,
    onOpenTeam,
}) => {
    const { current: mapRef } = useMap();

    useEffect(() => {
        const map = mapRef?.getMap();
        if (!map) return undefined;
        const getTeamId = (event: MapLayerMouseEvent) => {
            const orgUnitId = event.features?.[0]?.properties.id;
            return orgUnitId === undefined
                ? undefined
                : teamIdByOrgUnitId.get(orgUnitId);
        };
        const setCursor = (cursor: string) => {
            map.getCanvas().style.cursor = cursor;
        };
        const handleMove = (event: MapLayerMouseEvent) =>
            setCursor(getTeamId(event) ? 'pointer' : '');
        const handleLeave = () => setCursor('');
        const handleClick = (event: MapLayerMouseEvent) => {
            const teamId = getTeamId(event);
            if (teamId) onOpenTeam(teamId);
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
    }, [mapRef, layerIds, teamIdByOrgUnitId, onOpenTeam]);

    return null;
};
