import React, { FunctionComponent, useCallback, useRef } from 'react';
import L from 'leaflet';
import { GeoJSON } from 'react-leaflet';
import { PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { MapToolTip } from 'Iaso/domains/registry/components/map/MapTooltip';
import { ASSIGNMENTS_TARGET_CLASS } from '../../constants/ui';

type Props = {
    ou: PlanningOrgUnits;
    canAssign: boolean;
    handleSaveAssignment: (id: number) => void;
    getAssignmentColor: (id: number) => string;
    opacity?: number;
};
export const MapShape: FunctionComponent<Props> = ({
    ou,
    canAssign,
    handleSaveAssignment,
    getAssignmentColor,
    opacity = 0.8,
}) => {
    const canAssignRef = useRef(canAssign);
    canAssignRef.current = canAssign;
    const handleSaveAssignmentRef = useRef(handleSaveAssignment);
    handleSaveAssignmentRef.current = handleSaveAssignment;

    const onEachFeature = useCallback(
        (_feature: unknown, layer: L.Layer) => {
            layer.on('click', () => {
                if (canAssignRef.current) {
                    handleSaveAssignmentRef.current(ou.id);
                }
            });
        },
        [ou.id],
    );

    if (!ou.geo_json) {
        return null;
    }

    return (
        <GeoJSON
            key={ou.id}
            onEachFeature={onEachFeature}
            data={ou.geo_json}
            style={
                {
                    color: getAssignmentColor(ou.id),
                    fillOpacity: opacity,
                    fill: getAssignmentColor(ou.id),
                    className: ASSIGNMENTS_TARGET_CLASS,
                } as L.PathOptions & { fill: string }
            }
        >
            <MapToolTip pane="popupPane" label={ou.name} />
        </GeoJSON>
    );
};
