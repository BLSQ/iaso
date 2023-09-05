import React, { useMemo } from 'react';
import get from 'lodash/get';
import { useSafeIntl, Column } from 'bluesquare-components';

import { AssignmentsApi } from '../types/assigment';
import { AssignmentUnit } from '../types/locations';
import { DropdownTeamsOptions, Team } from '../types/team';

import { getOrgUnitAssignation } from '../utils';
import { Profile } from '../../../utils/usersUtils';

import { UsersTeamsCell } from '../components/UsersTeamsCell';
import { LinkToOrgUnit } from '../../orgUnits/components/LinkToOrgUnit';

import MESSAGES from '../messages';

type Props = {
    orgUnits: Array<AssignmentUnit>;
    assignments: AssignmentsApi;
    teams: DropdownTeamsOptions[] | undefined;
    profiles: Profile[] | undefined;
    currentTeam?: Team;
};

const getParentCount = (orgUnit: AssignmentUnit, count = 0): number => {
    let newCount = count;
    if (orgUnit.parent) {
        newCount += 1 + getParentCount(orgUnit.parent, newCount);
    }
    return newCount;
};

export const useColumns = ({
    orgUnits,
    assignments,
    teams,
    profiles,
    currentTeam,
}: Props): Column[] => {
    const { formatMessage } = useSafeIntl();
    const firstOrgunit: AssignmentUnit = orgUnits[0];
    const parentCount: number = firstOrgunit ? getParentCount(firstOrgunit) : 0;
    return useMemo(() => {
        const columns: Column[] = [
            {
                Header: formatMessage(MESSAGES.orgUnits),
                id: 'name',
                accessor: 'name',
                align: 'left',
                Cell: settings => {
                    return <LinkToOrgUnit orgUnit={settings.row.original} />;
                },
            },
        ];
        Array(parentCount > 0 ? parentCount - 1 : parentCount)
            .fill(null)
            .forEach((_, index) => {
                columns.push({
                    Header: formatMessage(MESSAGES.orgUnitsParent, {
                        index: index + 1,
                    }),
                    id: `parent__${'parent__'.repeat(index)}name`,
                    accessor: `parent.${'parent.'.repeat(index)}name`,
                    align: 'center',
                    Cell: settings => {
                        return (
                            <LinkToOrgUnit
                                orgUnit={get(
                                    settings.row.original,
                                    `parent${'.parent'.repeat(index)}`,
                                )}
                            />
                        );
                    },
                });
            });
        const assignationColumn: Column = {
            Header: formatMessage(MESSAGES.assignment),
            id:
                currentTeam?.type === 'TEAM_OF_TEAMS'
                    ? 'assignment__team__name'
                    : 'assignment__user__username',
            Cell: settings => {
                return (
                    <UsersTeamsCell
                        assignmentObject={getOrgUnitAssignation(
                            assignments,
                            settings.row.original,
                            teams || [],
                            profiles || [],
                            undefined,
                        )}
                    />
                );
            },
        };
        columns.push(assignationColumn);
        return columns;
    }, [
        formatMessage,
        parentCount,
        currentTeam?.type,
        assignments,
        teams,
        profiles,
    ]);
};
