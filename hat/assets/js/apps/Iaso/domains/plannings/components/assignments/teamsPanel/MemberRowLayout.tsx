import React, { ReactNode, forwardRef } from 'react';
import PersonIcon from '@mui/icons-material/Person';
import { Box, Tooltip, Typography, alpha } from '@mui/material';
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
    highlightedRow: {
        bgcolor: alpha(amber[600], 0.18),
        '&:hover': { bgcolor: alpha(amber[600], 0.28) },
    },
    highlightedName: {
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
    highlightedScopeLine: {
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
    assignedCount: number;
    onClick?: () => void;
    isHighlighted?: boolean;
    isDisabled?: boolean;
    caption?: string;
    actions?: ReactNode;
};

export const MemberRowLayout = forwardRef<HTMLDivElement, Props>(
    (
        {
            row: { depth, name, color, team },
            assignedCount,
            onClick,
            isHighlighted = false,
            isDisabled = false,
            caption,
            actions,
            ...tooltipProps
        },
        ref,
    ) => {
        const { formatMessage } = useSafeIntl();
        const teamCaption = useTeamCaption(team);
        return (
            <TeamsPanelRowLayout
                {...tooltipProps}
                ref={ref}
                paddingLeft={20 + depth * INDENT_PX}
                guideLevels={depth - 1}
                onClick={onClick}
                sx={[
                    styles.row,
                    isHighlighted && styles.highlightedRow,
                    isDisabled && styles.disabledRow,
                ]}
                leading={
                    <ColorBadge
                        backgroundColor={color}
                        sx={styles.colorBadge}
                    />
                }
                nameIcon={
                    team ? (
                        <TeamTypeIcon type={team.type} sx={styles.icon} />
                    ) : (
                        <PersonIcon sx={styles.icon} />
                    )
                }
                name={name}
                nameSx={isHighlighted ? styles.highlightedName : undefined}
                caption={caption ?? teamCaption}
                trailing={
                    <>
                        <Tooltip
                            title={formatMessage(MESSAGES.orgUnitsAssigned)}
                        >
                            <Typography variant="body2" sx={styles.count}>
                                {assignedCount}
                            </Typography>
                        </Tooltip>
                        {actions}
                    </>
                }
            >
                <Box
                    sx={[
                        styles.scopeLine,
                        isHighlighted && styles.highlightedScopeLine,
                    ]}
                    style={{ left: 20 + (depth - 1) * INDENT_PX }}
                />
            </TeamsPanelRowLayout>
        );
    },
);

MemberRowLayout.displayName = 'MemberRowLayout';
