import React, { FC } from 'react';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { IconButton, Tooltip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { useAssignmentsParams } from '../../../hooks/useAssignmentsParams';
import MESSAGES from '../../../messages';

export const OnlyUnassignedToggle: FC = () => {
    const { formatMessage } = useSafeIntl();
    const { onlyUnassigned, toggleOnlyUnassigned } = useAssignmentsParams();
    const label = formatMessage(
        onlyUnassigned
            ? MESSAGES.showAllOrgUnits
            : MESSAGES.showOnlyUnassignedOrgUnits,
    );
    return (
        <Tooltip title={label}>
            <IconButton
                onClick={toggleOnlyUnassigned}
                color={onlyUnassigned ? 'primary' : 'default'}
                aria-label={label}
                aria-pressed={onlyUnassigned}
            >
                <FilterAltIcon />
            </IconButton>
        </Tooltip>
    );
};
