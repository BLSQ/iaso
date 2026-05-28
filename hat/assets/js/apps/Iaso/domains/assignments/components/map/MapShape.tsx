import React, { FunctionComponent } from 'react';
import { GeoJSON } from 'react-leaflet';
import { PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { MapToolTip } from 'Iaso/domains/registry/components/map/MapTooltip';

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
    return (
        <GeoJSON
            key={ou.id}
            eventHandlers={{
                click: () => canAssign && handleSaveAssignment(ou.id),
            }}
            data={ou.geo_json}
            style={{
                color: getAssignmentColor(ou.id),
                fillOpacity: opacity,
                fillColor: getAssignmentColor(ou.id),
            }}
        >
            <MapToolTip pane="popupPane" label={ou.name} />
        </GeoJSON>
    );
};
