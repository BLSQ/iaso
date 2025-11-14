import React, { useCallback, useMemo } from 'react';
import { Box, Radio } from '@mui/material';
import { Theme, useTheme } from '@mui/material/styles';
import { Column, IntlFormatMessage, useSafeIntl } from 'bluesquare-components';

import { ColorPicker } from '../../../components/forms/ColorPicker';

import { Profile } from '../../../utils/usersUtils';
import {
    DropdownTeamsOptions,
    SubTeam,
    Team,
    User,
} from '../../teams/types/team';
import MESSAGES from '../messages';
import { AssignmentsApi } from '../types/assigment';
import { AssignmentUnit } from '../types/locations';

import { getTeamUserName } from '../utils';

type Props = {
    assignments: AssignmentsApi;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    setItemColor: (color: string, teamId: number) => void;
    selectedItem: SubTeam | User | undefined;
    setSelectedItem: (newSelectedTeam: SubTeam) => void;
    currentTeam: Team | undefined;
    orgUnits: Array<AssignmentUnit>;
};

export const useColumns = ({
    assignments,
    teams,
    profiles,
    setItemColor,
    selectedItem,
    setSelectedItem,
    currentTeam,
    orgUnits,
}: Props): Column[] => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const theme: Theme = useTheme();
    const getAssignationsCount = useCallback(
        (rowId: number): number | string => {
            return assignments.filter(assignment => {
                if (currentTeam?.type === 'TEAM_OF_TEAMS') {
                    return (
                        assignment.team === rowId &&
                        orgUnits.some(
                            orgUnit => orgUnit.id === assignment.org_unit,
                        )
                    );
                }
                return (
                    assignment.user === rowId &&
                    orgUnits.some(orgUnit => orgUnit.id === assignment.org_unit)
                );
            }).length;
        },
        [assignments, currentTeam?.type, orgUnits],
    );

    const getFullItem = useCallback(
        (rowId: number): undefined | DropdownTeamsOptions | Profile => {
            if (currentTeam?.type === 'TEAM_OF_USERS') {
                return profiles.find(profile => profile.user_id === rowId);
            }
            if (currentTeam?.type === 'TEAM_OF_TEAMS') {
                return teams.find(team => team.original.id === rowId);
            }
            return undefined;
        },
        [currentTeam?.type, profiles, teams],
    );
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
                    const fullItem = getFullItem(settings.row.original.id);
                    return (
                        <Box display="flex" justifyContent="center">
                            <ColorPicker
                                currentColor={
                                    fullItem?.color ?? theme.palette.grey[500]
                                }
                                displayLabel={false}
                                onChangeColor={color =>
                                    setItemColor(
                                        color,
                                        settings.row.original.id,
                                    )
                                }
                            />
                        </Box>
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
                            {getAssignationsCount(settings.row.original.id)}
                        </div>
                    );
                },
            },
        ];
    }, [
        currentTeam,
        formatMessage,
        getAssignationsCount,
        getFullItem,
        profiles,
        selectedItem?.id,
        setItemColor,
        setSelectedItem,
        teams,
        theme.palette.grey,
    ]);
};
