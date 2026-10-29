import React, { FC, useCallback } from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonIcon from '@mui/icons-material/Person';
import { Box, Tooltip, alpha } from '@mui/material';
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
    scopeLine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 2,
        bgcolor: 'primary.main',
        pointerEvents: 'none',
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
};

export const TeamMemberRow: FC<Props> = ({
    row: { depth, name, color, team },
    onOpen,
}) => {
    const { formatMessage } = useSafeIntl();
    const caption = useTeamCaption(team);
    const handleOpen = useCallback(() => {
        if (team) onOpen(team.id);
    }, [onOpen, team]);

    const row = (
        <TeamsPanelRowLayout
            paddingLeft={20 + depth * INDENT_PX}
            guideLevels={depth - 1}
            onClick={team && handleOpen}
            sx={styles.row}
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
            caption={caption}
            trailing={team && <ChevronRightIcon sx={styles.openIcon} />}
        >
            <Box
                sx={styles.scopeLine}
                style={{ left: 20 + (depth - 1) * INDENT_PX }}
            />
        </TeamsPanelRowLayout>
    );

    return team ? (
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
