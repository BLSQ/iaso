import React, { FC, useCallback, useMemo, useState } from 'react';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import {
    Box,
    Button,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import USERS_MESSAGES from 'Iaso/domains/users/messages';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import { useAssignmentsParams } from '../../../hooks/useAssignmentsParams';
import MESSAGES from '../../../messages';
import { DeleteAssignmentsDialog } from '../assign/DeleteAssignmentsDialog';
import { useMemberAssignments } from '../assign/useMemberAssignments';
import {
    useNoAreaMessage,
    useTeamIdsWithArea,
} from '../assign/useSelectedTeamArea';
import { TeamMemberRow } from './TeamMemberRow';
import { TeamNavRow } from './TeamNavRow';
import { flattenAssignPanelRows, flattenTeamsPanelRows } from './utils';

const styles = {
    panel: {
        flex: '1 0 320px',
        maxWidth: 400,
        minHeight: 420,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 0.5,
        py: 1.5,
        pl: 2,
        pr: 1,
        borderBottom: 1,
        borderColor: 'divider',
    },
    headerTexts: {
        flex: 1,
        minWidth: 0,
    },
    rows: {
        flex: '1 1 0',
        minHeight: 0,
        overflow: 'auto',
        py: 0.5,
    },
    footer: {
        px: 2,
        py: 1.5,
        borderTop: 1,
        borderColor: 'divider',
        lineHeight: 1.5,
    },
    showButton: {
        alignSelf: 'flex-start',
    },
} satisfies SxStyles;

export const TeamsPanel: FC = () => {
    const { formatMessage } = useSafeIntl();
    const { openTeam, pickAssignee, mode } = useAssignmentsParams();
    const isAssignMode = mode === 'assign';
    const {
        planning,
        tree,
        teamChain,
        selectedTeam,
        expandedTeamIds,
        toggleTeam,
        currentAssignee,
    } = useAssignmentsContext();
    const noAreaMessage = useNoAreaMessage();
    const teamIdsWithArea = useTeamIdsWithArea();
    const {
        getAssignedCount,
        requestRemoval,
        pendingRemoval,
        confirmRemoval,
        cancelRemoval,
    } = useMemberAssignments();
    const targetGeographyName = planning.org_unit_details?.name;
    const [isOpen, setIsOpen] = useState(true);
    const toggleOpen = useCallback(() => setIsOpen(open => !open), []);

    const rows = useMemo(
        () =>
            isAssignMode
                ? flattenAssignPanelRows(
                      tree,
                      teamChain,
                      currentAssignee?.team?.id,
                  )
                : flattenTeamsPanelRows(tree, teamChain, expandedTeamIds),
        [isAssignMode, tree, teamChain, currentAssignee, expandedTeamIds],
    );

    if (!isOpen) {
        return (
            <Button
                size="small"
                startIcon={<LastPageIcon />}
                onClick={toggleOpen}
                sx={styles.showButton}
            >
                {formatMessage(USERS_MESSAGES.teams)}
            </Button>
        );
    }

    const getHelp = () => {
        if (!isAssignMode) return formatMessage(MESSAGES.teamsPanelExploreHelp);
        return noAreaMessage ?? formatMessage(MESSAGES.teamsPanelAssignHelp);
    };

    const rootCaption =
        targetGeographyName &&
        formatMessage(MESSAGES.targetGeographyCaption, {
            name: targetGeographyName,
        });

    return (
        <Paper sx={styles.panel}>
            <Box sx={styles.header}>
                <Box sx={styles.headerTexts}>
                    <Typography variant="body1" fontWeight={500}>
                        {formatMessage(USERS_MESSAGES.teams)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {getHelp()}
                    </Typography>
                </Box>
                <Tooltip title={formatMessage(MESSAGES.hideTeams)}>
                    <IconButton size="small" onClick={toggleOpen}>
                        <FirstPageIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
            <Stack sx={styles.rows}>
                {rows.map(row =>
                    row.kind === 'team' ? (
                        <TeamNavRow
                            key={row.key}
                            row={row}
                            caption={row.depth === 0 ? rootCaption : undefined}
                            onOpen={openTeam}
                            onToggle={toggleTeam}
                        />
                    ) : (
                        <TeamMemberRow
                            key={row.key}
                            row={row}
                            onOpen={openTeam}
                            isAssignMode={isAssignMode}
                            isCurrentAssignee={row.key === currentAssignee?.key}
                            isPickable={teamIdsWithArea.has(row.parentTeam.id)}
                            onPickAssignee={pickAssignee}
                            assignedCount={getAssignedCount(row)}
                            onRemoveAssignments={
                                row.parentTeam.id === selectedTeam.id
                                    ? requestRemoval
                                    : undefined
                            }
                        />
                    ),
                )}
            </Stack>
            <Typography
                variant="caption"
                color="text.secondary"
                component="div"
                sx={styles.footer}
            >
                {formatMessage(MESSAGES.teamsPanelAssignNote)}
            </Typography>
            <DeleteAssignmentsDialog
                open={Boolean(pendingRemoval)}
                title={pendingRemoval?.title ?? ''}
                text={pendingRemoval?.text ?? ''}
                onConfirm={confirmRemoval}
                onClose={cancelRemoval}
            />
        </Paper>
    );
};
