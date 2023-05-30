import React, { useMemo } from 'react';
import { Box, Radio } from '@material-ui/core';
import { Theme, useTheme } from '@material-ui/core/styles';
import { useSafeIntl, Column, IntlFormatMessage } from 'bluesquare-components';

import { ColorPicker } from '../../../components/forms/ColorPicker';

import { AssignmentsApi } from '../types/assigment';
import { DropdownTeamsOptions, SubTeam, User, Team } from '../types/team';

import { Profile } from '../../../utils/usersUtils';

import { getTeamUserName } from '../utils';

import { colors } from '../constants/colors';

import MESSAGES from '../messages';

type Props = {
    assignments: AssignmentsApi;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    // eslint-disable-next-line no-unused-vars
    setItemColor: (color: string, teamId: number) => void;
    selectedItem: SubTeam | User | undefined;
    // eslint-disable-next-line no-unused-vars
    setSelectedItem: (newSelectedTeam: SubTeam) => void;
    currentTeam: Team | undefined;
};

export const useColumns = ({
    assignments,
    teams,
    profiles,
    setItemColor,
    selectedItem,
    setSelectedItem,
    currentTeam,
}: Props): Column[] => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const theme: Theme = useTheme();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.selection),
                id: 'selection',
                accessor: 'selection',
                sortable: false,
                width: 30,
                Cell: settings => {
                    return (
                        <>
                            <Box display="flex" justifyContent="center">
                                <Radio
                                    checked={
                                        selectedItem?.id ===
                                        settings.row.original.id
                                    }
                                    onChange={() =>
                                        setSelectedItem(settings.row.original)
                                    }
                                />
                            </Box>
                        </>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.name),
                id: currentTeam?.type === 'TEAM_OF_USERS' ? 'username' : 'name',
                accessor:
                    currentTeam?.type === 'TEAM_OF_USERS' ? 'username' : 'name',
                Cell: settings => {
                    return (
                        <>
                            {getTeamUserName(
                                settings.row.original,
                                currentTeam,
                                profiles,
                                teams,
                            )}
                        </>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.color),
                id: 'color',
                accessor: 'color',
                Cell: settings => {
                    let fullItem;
                    if (currentTeam?.type === 'TEAM_OF_USERS') {
                        fullItem = profiles.find(
                            profile =>
                                profile.user_id === settings.row.original.id,
                        );
                    }
                    if (currentTeam?.type === 'TEAM_OF_TEAMS') {
                        fullItem = teams.find(
                            team =>
                                team.original.id === settings.row.original.id,
                        );
                    }
                    return (
                        <>
                            <Box display="flex" justifyContent="center">
                                <ColorPicker
                                    currentColor={
                                        fullItem?.color ??
                                        theme.palette.grey[500]
                                    }
                                    colors={colors.filter(
                                        color =>
                                            !fullItem ||
                                            (fullItem &&
                                                color !== fullItem.color),
                                    )}
                                    displayLabel={false}
                                    onChangeColor={color =>
                                        setItemColor(
                                            color,
                                            settings.row.original.id,
                                        )
                                    }
                                />
                            </Box>
                        </>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.assignationsCount),
                id: 'assignationsCount',
                accessor: 'assignationsCount',
                sortable: false,
                Cell: settings => {
                    return (
                        <div>
                            {
                                assignments.filter(assignment => {
                                    if (currentTeam?.type === 'TEAM_OF_TEAMS') {
                                        return (
                                            assignment.team ===
                                            settings.row.original.id
                                        );
                                    }
                                    return (
                                        assignment.user ===
                                        settings.row.original.id
                                    );
                                }).length
                            }
                        </div>
                    );
                },
            },
        ];
    }, [
        assignments,
        currentTeam,
        formatMessage,
        profiles,
        selectedItem?.id,
        setItemColor,
        setSelectedItem,
        teams,
        theme.palette.grey,
    ]);
};
