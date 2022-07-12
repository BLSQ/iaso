import React, { useMemo } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import { AssignmentsApi } from '../types/assigment';
import { AssignmentUnit } from '../types/locations';
import { DropdownTeamsOptions } from '../types/team';
import { Column } from '../../../types/table';

import { getOrgUnitAssignation } from '../utils';

import { Profile } from '../../../utils/usersUtils';

import { UsersTeamsCell } from '../components/UsersTeamsCell';

import MESSAGES from '../messages';

type Props = {
    orgUnits: Array<AssignmentUnit>;
    assignments: AssignmentsApi;
    teams: DropdownTeamsOptions[] | undefined;
    profiles: Profile[] | undefined;
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
                });
            });
        const assignationColumn: Column = {
            Header: formatMessage(MESSAGES.assignment),
            id: 'assignment',
            sortable: false,
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
    }, [assignments, formatMessage, profiles, teams, parentCount]);
};
