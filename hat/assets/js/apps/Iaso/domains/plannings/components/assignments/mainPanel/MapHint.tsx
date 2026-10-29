import React, { FC, useCallback, useState } from 'react';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { TeamType } from 'Iaso/domains/teams/constants';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import MESSAGES from '../../../messages';
import { getTeamMembers } from '../utils';

// Placed right of the map's zoom controls.
const styles = {
    container: {
        position: 'absolute',
        top: 10,
        left: 52,
        right: 60,
        zIndex: 1,
        pointerEvents: 'none',
    },
    hint: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 0.75,
        maxWidth: 560,
        py: 0.5,
        pl: 1.5,
        pr: 0.5,
        bgcolor: 'rgba(255,255,255,0.94)',
        pointerEvents: 'auto',
    },
    hintIcon: {
        fontSize: 18,
        color: 'mediumGray.main',
        mt: 0.75,
    },
    hintText: {
        flex: 1,
        py: 0.75,
    },
    showButton: {
        width: 'fit-content',
        pointerEvents: 'auto',
    },
} satisfies SxStyles;

export const MapHint: FC = () => {
    const { formatMessage } = useSafeIntl();
    const { selectedTeam } = useAssignmentsContext();
    const [isOpen, setIsOpen] = useState(true);
    const toggle = useCallback(() => setIsOpen(previous => !previous), []);

    if (!isOpen) {
        return (
            <Box sx={styles.container}>
                <Paper sx={styles.showButton}>
                    <Tooltip title={formatMessage(MESSAGES.showHelp)}>
                        <IconButton size="small" onClick={toggle}>
                            <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Paper>
            </Box>
        );
    }

    let hint = MESSAGES.mapExploreHintTeams;
    if (!getTeamMembers(selectedTeam).length) {
        hint = MESSAGES.mapHintNoMember;
    } else if (selectedTeam.type === TeamType.TEAM_OF_USERS) {
        hint = MESSAGES.mapExploreHintUsers;
    }
    return (
        <Box sx={styles.container}>
            <Paper sx={styles.hint}>
                <InfoOutlinedIcon sx={styles.hintIcon} />
                <Typography variant="caption" sx={styles.hintText}>
                    {formatMessage(hint)}
                </Typography>
                <Tooltip title={formatMessage(MESSAGES.hideHelp)}>
                    <IconButton size="small" onClick={toggle}>
                        <ExpandLessIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Paper>
        </Box>
    );
};
