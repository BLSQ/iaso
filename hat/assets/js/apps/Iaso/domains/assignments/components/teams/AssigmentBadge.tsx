import React from 'react';
import { SvgIconComponent } from '@mui/icons-material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { Badge, SvgIconProps } from '@mui/material';

export const createAssigmentBadgeIcon = (count: number): SvgIconComponent => {
    const AssigmentBadgeIcon = (props: SvgIconProps) => (
        <Badge badgeContent={count} color="secondary">
            <AssignmentTurnedInIcon {...props} />
        </Badge>
    );
    AssigmentBadgeIcon.muiName = 'AssigmentBadge';
    return AssigmentBadgeIcon as SvgIconComponent;
};
