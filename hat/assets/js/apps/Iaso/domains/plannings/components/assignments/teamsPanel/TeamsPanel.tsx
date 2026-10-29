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
import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import USERS_MESSAGES from 'Iaso/domains/users/messages';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsParams } from '../../../hooks/useAssignmentsParams';
import MESSAGES from '../../../messages';
import { TeamMemberRow } from './TeamMemberRow';
import { TeamNavRow } from './TeamNavRow';
import { flattenTeamsPanelRows } from './utils';

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

type Props = {
    tree: TeamTreeNode;
    teamChain: TeamTreeNode[];
    expandedTeamIds: Set<number>;
    onToggleTeam: (teamId: number) => void;
    targetGeographyName?: string;
};

export const TeamsPanel: FC<Props> = ({
    tree,
    teamChain,
    expandedTeamIds,
    onToggleTeam,
    targetGeographyName,
}) => {
    const { formatMessage } = useSafeIntl();
    const { openTeam } = useAssignmentsParams();
    const [isOpen, setIsOpen] = useState(true);
    const toggleOpen = useCallback(() => setIsOpen(open => !open), []);

    const rows = useMemo(
        () => flattenTeamsPanelRows(tree, teamChain, expandedTeamIds),
        [tree, teamChain, expandedTeamIds],
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
                        {formatMessage(MESSAGES.teamsPanelExploreHelp)}
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
                            onToggle={onToggleTeam}
                        />
                    ) : (
                        <TeamMemberRow
                            key={row.key}
                            row={row}
                            onOpen={openTeam}
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
        </Paper>
    );
};
