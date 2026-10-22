import React, { FC, MouseEvent, useCallback } from 'react';
import EditLocationAltIcon from '@mui/icons-material/EditLocationAlt';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsParams } from '../../hooks/useAssignmentsParams';
import MESSAGES from '../../messages';
import { AssignmentsMode } from '../../types';

const styles = {
    button: {
        gap: 0.75,
        px: 1.25,
    },
} satisfies SxStyles;

export const ModeToggle: FC = () => {
    const { formatMessage } = useSafeIntl();
    const { mode, updateParams } = useAssignmentsParams();
    const handleChange = useCallback(
        (_event: MouseEvent<HTMLElement>, value: AssignmentsMode | null) => {
            if (value) updateParams({ mode: value });
        },
        [updateParams],
    );
    return (
        <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={handleChange}
            size="small"
            color="primary"
            aria-label={formatMessage(MESSAGES.assignmentsMode)}
        >
            <Tooltip title={formatMessage(MESSAGES.exploreModeTooltip)}>
                <ToggleButton value="explore" sx={styles.button}>
                    <TravelExploreIcon fontSize="small" />
                    {formatMessage(MESSAGES.explore)}
                </ToggleButton>
            </Tooltip>
            <Tooltip title={formatMessage(MESSAGES.assignModeTooltip)}>
                <ToggleButton value="assign" sx={styles.button}>
                    <EditLocationAltIcon fontSize="small" />
                    {formatMessage(MESSAGES.assign)}
                </ToggleButton>
            </Tooltip>
        </ToggleButtonGroup>
    );
};
