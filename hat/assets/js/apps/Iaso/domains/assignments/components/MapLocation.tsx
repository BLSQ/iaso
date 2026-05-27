import React, { FunctionComponent } from 'react';
import CircleMarkerComponent from 'Iaso/components/maps/markers/CircleMarkerComponent';
import { PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { MapToolTip } from 'Iaso/domains/registry/components/map/MapTooltip';
import { circleColorMarkerOptions } from 'Iaso/utils/map/mapUtils';

type Props = {
    ou: PlanningOrgUnits;
    canAssign: boolean;
    handleSaveAssignment: (id: number) => void;
    getAssignmentColor: (id: number) => string;
};
export const MapLocation: FunctionComponent<Props> = ({
    ou,
    canAssign,
    handleSaveAssignment,
    getAssignmentColor,
}) => {
    return (
        <CircleMarkerComponent
            key={ou.id}
            item={ou}
            onClick={() => canAssign && handleSaveAssignment(ou.id)}
            TooltipComponent={MapToolTip}
            tooltipProps={() => ({
                pane: 'popupPane',
                label: ou.name,
            })}
            markerProps={() => ({
                ...circleColorMarkerOptions(getAssignmentColor(ou.id)),
                radius: 12,
            })}
        />
    );
};
