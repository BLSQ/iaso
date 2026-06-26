import React, { FunctionComponent } from 'react';
import CircleMarkerComponent from 'Iaso/components/maps/markers/CircleMarkerComponent';
import { PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { MapToolTip } from 'Iaso/domains/registry/components/map/MapTooltip';
import { circleColorMarkerOptions } from 'Iaso/utils/map/mapUtils';
import { ASSIGNMENTS_TARGET_CLASS } from '../../constants/ui';

type Props = {
    ou: PlanningOrgUnits;
    canAssign: boolean;
    handleClick: (id: number) => void;
    getAssignmentColor: (id: number) => string;
};
export const MapLocation: FunctionComponent<Props> = ({
    ou,
    canAssign,
    handleClick,
    getAssignmentColor,
}) => {
    return (
        <CircleMarkerComponent
            key={ou.id}
            item={ou}
            onClick={() => canAssign && handleClick(ou.id)}
            TooltipComponent={MapToolTip}
            tooltipProps={() => ({
                pane: 'popupPane',
                label: ou.name,
            })}
            markerProps={() => {
                const options = circleColorMarkerOptions(
                    getAssignmentColor(ou.id),
                );
                return {
                    ...options,
                    radius: 12,
                    className: `${options.className} ${ASSIGNMENTS_TARGET_CLASS}`,
                };
            }}
        />
    );
};
