import React from 'react';
import { Box, Radio } from '@material-ui/core';
import { Theme } from '@material-ui/core/styles';

import { ColorPicker } from '../../../components/forms/ColorPicker';

import { AssignmentsApi } from '../types/assigment';
import { DropdownTeamsOptions, SubTeam } from '../types/team';
import { Column } from '../../../types/table';
import { IntlFormatMessage } from '../../../types/intl';

import { teamsColors } from '../constants/teamColors';

import MESSAGES from '../messages';

type Props = {
    formatMessage: IntlFormatMessage;
    assignments: AssignmentsApi;
    teams: DropdownTeamsOptions[];
    // eslint-disable-next-line no-unused-vars
    setTeamColor: (color: string, teamId: number) => void;
    theme: Theme;
    selectedTeam: SubTeam | undefined;
    // eslint-disable-next-line no-unused-vars
    setSelectedTeam: (newSelectedTeam: SubTeam) => void;
};

export const getColumns = ({
    formatMessage,
    assignments,
    teams,
    setTeamColor,
    theme,
    selectedTeam,
    setSelectedTeam,
}: Props): Column[] => {
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
                                    selectedTeam?.id ===
                                    settings.row.original.id
                                }
                                onChange={() =>
                                    setSelectedTeam(settings.row.original)
                                }
                            />
                        </Box>
                    </>
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.name),
            id: 'name',
            accessor: 'name',
        },
        {
            Header: formatMessage(MESSAGES.color),
            id: 'color',
            accessor: 'color',
            Cell: settings => {
                const fullTeam = teams.find(
                    team => team.original.id === settings.row.original.id,
                );
                return (
                    <>
                        <Box display="flex" justifyContent="center">
                            <ColorPicker
                                currentColor={
                                    fullTeam?.color ?? theme.palette.grey[500]
                                }
                                colors={teamsColors.filter(
                                    color =>
                                        !fullTeam ||
                                        (fullTeam && color !== fullTeam.color),
                                )}
                                displayLabel={false}
                                onChangeColor={color =>
                                    setTeamColor(
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
                            assignments.filter(
                                assignment =>
                                    assignment.team ===
                                    settings.row.original.id,
                            ).length
                        }
                    </div>
                );
            },
        },
    ];
};
