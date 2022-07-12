import React, { useMemo } from 'react';
import { Tooltip, Box, Checkbox } from '@material-ui/core';

import {
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import { Column } from '../../../types/table';
import { IntlFormatMessage } from '../../../types/intl';
import { AssignmentsApi } from '../types/assigment';
import { DropdownTeamsOptions, SubTeam, User } from '../types/team';
import { Profile } from '../../../utils/usersUtils';

import { LinkToOrgUnit } from '../components/LinkToOrgUnit';
import MESSAGES from '../messages';
import { getOrgUnitAssignation } from '../utils';

type Props = {
    orgUnitsToUpdate: Array<number>;
    // eslint-disable-next-line no-unused-vars
    setOrgUnitsToUpdate: (ids: Array<number>) => void;
    allAssignments: AssignmentsApi;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    currentType: 'TEAM_OF_TEAMS' | 'TEAM_OF_USERS' | undefined;
    selectedItem: SubTeam | User | undefined;
};

export const useColumns = ({
    orgUnitsToUpdate,
    setOrgUnitsToUpdate,
    allAssignments,
    teams,
    profiles,
    currentType,
    selectedItem,
}: Props): Column[] => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: 'ID',
                id: 'id',
                accessor: 'id',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.name),
                id: 'name',
                accessor: 'name',
                sortable: false,
                Cell: settings => {
                    return <LinkToOrgUnit orgUnit={settings.row.original} />;
                },
            },
            {
                Header: formatMessage(MESSAGES.assignment),
                id: 'assignment',
                accessor: 'assignment',
                sortable: false,
                Cell: settings => {
                    const orgUnitId = settings.row.original.id;
                    const checked = orgUnitsToUpdate.includes(orgUnitId);
                    const { assignment } = getOrgUnitAssignation(
                        allAssignments,
                        settings.row.original,
                        teams,
                        profiles,
                        currentType,
                    );
                    const disabled =
                        assignment?.org_unit === orgUnitId &&
                        (assignment?.team === selectedItem?.id ||
                            assignment?.user === selectedItem?.id);
                    return (
                        <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            {!disabled && (
                                <Checkbox
                                    size="small"
                                    color="primary"
                                    checked={checked}
                                    onChange={() => {
                                        let orgUnits = [...orgUnitsToUpdate];
                                        if (checked) {
                                            orgUnits = orgUnits.filter(
                                                orgunitId =>
                                                    orgunitId !== orgUnitId,
                                            );
                                        } else {
                                            orgUnits.push(orgUnitId);
                                        }
                                        setOrgUnitsToUpdate(orgUnits);
                                    }}
                                />
                            )}
                            {disabled && (
                                <Tooltip
                                    arrow
                                    placement="top"
                                    title={formatMessage(
                                        MESSAGES.alreadyAssigned,
                                    )}
                                >
                                    <Box>
                                        <Checkbox
                                            size="small"
                                            color="primary"
                                            checked
                                            disabled
                                        />
                                    </Box>
                                </Tooltip>
                            )}
                        </Box>
                    );
                },
            },
        ];
    }, [
        allAssignments,
        currentType,
        formatMessage,
        orgUnitsToUpdate,
        profiles,
        selectedItem?.id,
        setOrgUnitsToUpdate,
        teams,
    ]);
};
