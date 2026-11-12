import React, { FC, MouseEvent, useCallback } from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import PersonIcon from '@mui/icons-material/Person';
import { Box, IconButton, Tooltip, Typography, alpha } from '@mui/material';
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
    disabledRow: {
        opacity: 0.6,
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
    count: {
        minWidth: 22,
        textAlign: 'right',
        fontWeight: 500,
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
    isPickable: boolean;
    onPickAssignee: (teamId: number, memberKey: string) => void;
    assignedCount: number;
    // Only for the members of the selected team.
    onRemoveAssignments?: (memberKey: string) => void;
};

export const TeamMemberRow: FC<Props> = ({
    row: { key, depth, name, color, team, parentTeam },
    onOpen,
    isAssignMode,
    isCurrentAssignee,
    isPickable,
    onPickAssignee,
    assignedCount,
    onRemoveAssignments,
}) => {
    const { formatMessage } = useSafeIntl();
    const teamCaption = useTeamCaption(team);
    const handleOpen = useCallback(() => {
        if (team) onOpen(team.id);
    }, [onOpen, team]);
    const handlePick = useCallback(
        () => onPickAssignee(parentTeam.id, key),
        [onPickAssignee, parentTeam.id, key],
    );
    const handleRemove = useCallback(
        (event: MouseEvent) => {
            event.stopPropagation();
            onRemoveAssignments?.(key);
        },
        [onRemoveAssignments, key],
    );
    const isPicked = isAssignMode && isCurrentAssignee;
    const isDisabled = isAssignMode && !isPickable;
    const caption = isDisabled
        ? formatMessage(MESSAGES.assignParentTeamFirst, {
              team: parentTeam.name,
          })
        : teamCaption;

    const getOnClick = () => {
        if (isAssignMode) return isPickable ? handlePick : undefined;
        return team && handleOpen;
    };

    const row = (
        <TeamsPanelRowLayout
            paddingLeft={20 + depth * INDENT_PX}
            guideLevels={depth - 1}
            onClick={getOnClick()}
            sx={[
                styles.row,
                isPicked && styles.currentAssigneeRow,
                isDisabled && styles.disabledRow,
            ]}
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
            trailing={
                <>
                    <Tooltip title={formatMessage(MESSAGES.orgUnitsAssigned)}>
                        <Typography variant="body2" sx={styles.count}>
                            {assignedCount}
                        </Typography>
                    </Tooltip>
                    {isAssignMode && onRemoveAssignments && (
                        <Tooltip
                            title={formatMessage(
                                MESSAGES.removeMemberAssignments,
                            )}
                        >
                            <span>
                                <IconButton
                                    size="small"
                                    disabled={assignedCount === 0}
                                    onClick={handleRemove}
                                >
                                    <LinkOffIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    )}
                    {team && !isAssignMode && (
                        <ChevronRightIcon sx={styles.openIcon} />
                    )}
                </>
            }
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
        <Tooltip
            title={formatMessage(MESSAGES.openTeam, { name })}
            placement="right"
        >
            {row}
        </Tooltip>
    ) : (
        row
    );
};
