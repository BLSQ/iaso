import React, { useMemo, useCallback } from 'react';
import { Box, Radio } from '@mui/material';
import { Theme, useTheme } from '@mui/material/styles';
import { useSafeIntl, Column, IntlFormatMessage } from 'bluesquare-components';

import { ColorPicker } from '../../../components/forms/ColorPicker';

import { AssignmentsApi } from '../types/assigment';
import { DropdownTeamsOptions, SubTeam, User, Team } from '../types/team';

import { Profile } from '../../../utils/usersUtils';
import { AssignmentUnit } from '../types/locations';

import { getTeamUserName } from '../utils';

import { colors } from '../constants/colors';

import MESSAGES from '../messages';
import { NumberCell } from '../../../components/Cells/NumberCell';

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
    orgUnits: Array<AssignmentUnit>;
    isLoadingAssignments: boolean;
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
    isLoadingAssignments,
}: Props): Column[] => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const theme: Theme = useTheme();
    const getAssignationsCount = useCallback(
        (rowId: number): number => {
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
                    const fullItem = getFullItem(settings.row.original.id);
                    return (
                        <Box display="flex" justifyContent="center">
                            <ColorPicker
                                currentColor={
                                    fullItem?.color ?? theme.palette.grey[500]
                                }
                                colors={colors.filter(
                                    color =>
                                        !fullItem ||
                                        (fullItem && color !== fullItem.color),
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
                            {!isLoadingAssignments && (
                                <NumberCell
                                    value={getAssignationsCount(
                                        settings.row.original.id,
                                    )}
                                />
                            )}
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
        isLoadingAssignments,
        profiles,
        selectedItem?.id,
        setItemColor,
        setSelectedItem,
        teams,
        theme.palette.grey,
    ]);
};
