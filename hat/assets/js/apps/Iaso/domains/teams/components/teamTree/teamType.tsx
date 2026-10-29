import React, { FC } from 'react';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import GroupsIcon from '@mui/icons-material/Groups';
import { SvgIconProps } from '@mui/material';
import { TeamType } from 'Iaso/domains/teams/constants';
import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import MESSAGES from './messages';

export const TEAM_TYPE_DISPLAY = {
    [TeamType.TEAM_OF_TEAMS]: {
        label: MESSAGES.teamOfTeams,
        countLabel: MESSAGES.teamsCount,
        getCount: (team: TeamTreeNode) => team.children.length,
    },
    [TeamType.TEAM_OF_USERS]: {
        label: MESSAGES.teamOfUsers,
        countLabel: MESSAGES.usersCount,
        getCount: (team: TeamTreeNode) => team.users.length,
    },
};

type Props = SvgIconProps & {
    type?: TeamType;
};

export const TeamTypeIcon: FC<Props> = ({ type, ...iconProps }) =>
    type === TeamType.TEAM_OF_USERS ? (
        <GroupsIcon {...iconProps} />
    ) : (
        <AccountTreeIcon {...iconProps} />
    );
