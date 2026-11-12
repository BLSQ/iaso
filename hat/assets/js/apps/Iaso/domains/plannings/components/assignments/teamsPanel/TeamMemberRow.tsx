import React, { FC, MouseEvent, useCallback } from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonIcon from '@mui/icons-material/Person';
import { Box, IconButton, Tooltip, alpha } from '@mui/material';
import { amber } from '@mui/material/colors';
import { useSafeIntl } from 'bluesquare-components';
import { ColorBadge } from 'Iaso/components/ColorBadge';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import {
    TEAM_TYPE_DISPLAY,
    TeamTypeIcon,
} from 'Iaso/domains/teams/components/teamTree/teamType';
import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import USERS_MESSAGES from 'Iaso/domains/users/messages';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../../messages';
import { INDENT_PX, TeamsPanelRowLayout } from './TeamsPanelRowLayout';
import { TeamMemberRowData } from './types';

const styles = {
    row: theme => ({
        minHeight: 52,
        gap: 1,
        pr: 1,
        bgcolor: alpha(theme.palette.primary.main, 0.04),
    }),
    currentAssigneeRow: {
        bgcolor: alpha(amber[600], 0.18),
        '&:hover': { bgcolor: alpha(amber[600], 0.28) },
    },
    currentAssigneeName: {
        fontWeight: 500,
    },
    openButton: {
        p: 0.25,
    },
    scopeLine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 2,
        bgcolor: 'primary.main',
        pointerEvents: 'none',
    },
    currentAssigneeScopeLine: {
        width: 4,
    },
    colorBadge: {
        width: 16,
        height: 16,
        border: 'none',
        borderRadius: '3px',
        flexShrink: 0,
    },
    icon: {
        fontSize: 16,
        color: 'text.secondary',
        flexShrink: 0,
    },
    openIcon: {
        color: 'primary.main',
    },
} satisfies SxStyles;

const useTeamCaption = (team?: TeamTreeNode): string => {
    const { formatMessage } = useSafeIntl();
    if (!team) return formatMessage(USERS_MESSAGES.user);
    if (!team.type) return '';
    const { label, countLabel, getCount } = TEAM_TYPE_DISPLAY[team.type];
    return `${formatMessage(label)} · ${formatMessage(
        countLabel,
        numericValues({ count: getCount(team) }),
    )}`;
};

type Props = {
    row: TeamMemberRowData;
    onOpen: (teamId: number) => void;
    isAssignMode: boolean;
    isCurrentAssignee: boolean;
    onPickAssignee: (memberKey: string) => void;
};

export const TeamMemberRow: FC<Props> = ({
    row: { key, depth, name, color, team },
    onOpen,
    isAssignMode,
    isCurrentAssignee,
    onPickAssignee,
}) => {
    const { formatMessage } = useSafeIntl();
    const caption = useTeamCaption(team);
    const handleOpen = useCallback(() => {
        if (team) onOpen(team.id);
    }, [onOpen, team]);
    const handlePick = useCallback(
        () => onPickAssignee(key),
        [onPickAssignee, key],
    );
    // In assign mode the row picks the assignee: only the chevron opens the sub-team.
    const handleOpenButton = useCallback(
        (event: MouseEvent) => {
            event.stopPropagation();
            handleOpen();
        },
        [handleOpen],
    );
    const isPicked = isAssignMode && isCurrentAssignee;
    const openTooltip = formatMessage(MESSAGES.openTeam, { name });

    const openButton = isAssignMode ? (
        <Tooltip title={openTooltip} placement="right">
            <IconButton
                size="small"
                onClick={handleOpenButton}
                aria-label={openTooltip}
                sx={styles.openButton}
            >
                <ChevronRightIcon sx={styles.openIcon} />
            </IconButton>
        </Tooltip>
    ) : (
        <ChevronRightIcon sx={styles.openIcon} />
    );

    const row = (
        <TeamsPanelRowLayout
            paddingLeft={20 + depth * INDENT_PX}
            guideLevels={depth - 1}
            onClick={isAssignMode ? handlePick : team && handleOpen}
            sx={[styles.row, isPicked && styles.currentAssigneeRow]}
            leading={
                <ColorBadge backgroundColor={color} sx={styles.colorBadge} />
            }
            nameIcon={
                team ? (
                    <TeamTypeIcon type={team.type} sx={styles.icon} />
                ) : (
                    <PersonIcon sx={styles.icon} />
                )
            }
            name={name}
            nameSx={isPicked ? styles.currentAssigneeName : undefined}
            caption={caption}
            trailing={team && openButton}
        >
            <Box
                sx={[
                    styles.scopeLine,
                    isPicked && styles.currentAssigneeScopeLine,
                ]}
                style={{ left: 20 + (depth - 1) * INDENT_PX }}
            />
        </TeamsPanelRowLayout>
    );

    return team && !isAssignMode ? (
        <Tooltip title={openTooltip} placement="right">
            {row}
        </Tooltip>
    ) : (
        row
    );
};
