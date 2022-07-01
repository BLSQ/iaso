import React, { useMemo } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import { AssignmentsApi } from '../types/assigment';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgUnitShape, OrgUnitMarker } from '../types/locations';
import { DropdownTeamsOptions } from '../types/team';
import { Column } from '../../../types/table';

import { getOrgUnitAssignation } from '../utils';

import { Profile } from '../../../utils/usersUtils';

import { UsersTeamsCell } from '../components/UsersTeamsCell';

import MESSAGES from '../messages';

type Props = {
    orgUnits: Array<OrgUnitShape | OrgUnitMarker | OrgUnit>;
    assignments: AssignmentsApi;
    teams: DropdownTeamsOptions[] | undefined;
    profiles: Profile[] | undefined;
};

const getParentCount = (
    orgUnit: OrgUnitShape | OrgUnitMarker | OrgUnit,
    count = 0,
): number => {
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

    return useMemo(() => {
        const columns: Column[] = [
            {
                Header: formatMessage(MESSAGES.orgUnits),
                id: 'name',
                accessor: 'name',
                align: 'left',
            },
            // @ts-ignore
        ];
        const firstOrgunit: OrgUnitShape | OrgUnitMarker | OrgUnit =
            orgUnits[0];
        const parentCount: number = firstOrgunit
            ? getParentCount(firstOrgunit)
            : 0;
        Array(parentCount)
            .fill(null)
            .forEach((_, index) => {
                columns.push({
                    Header: formatMessage(MESSAGES.orgUnitsParent, {
                        index: index + 1,
                    }),
                    id: `parent.${'parent.'.repeat(index)}name`,
                    accessor: `parent.${'parent.'.repeat(index)}name`,
                    align: 'center',
                });
            });
        const assignationColumn: Column = {
            Header: formatMessage(MESSAGES.assignment),
            id: 'assignment',
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
    }, [assignments, formatMessage, orgUnits, profiles, teams]);
};
