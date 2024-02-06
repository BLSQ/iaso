import React, {
    FunctionComponent,
    MouseEvent,
    useCallback,
    useMemo,
} from 'react';
import get from 'lodash/get';
import { useSafeIntl, Column } from 'bluesquare-components';

import { Checkbox, Box, Tooltip } from '@mui/material';
import { useDispatch } from 'react-redux';
import { AssignmentParams, AssignmentsApi } from '../types/assigment';
import { AssignmentUnit } from '../types/locations';
import { DropdownTeamsOptions, Team } from '../types/team';

import { getOrgUnitAssignation } from '../utils';
import { Profile } from '../../../utils/usersUtils';

import { UsersTeamsCell } from '../components/UsersTeamsCell';
import { LinkToOrgUnit } from '../../orgUnits/components/LinkToOrgUnit';
import { redirectTo } from '../../../routing/actions';

import MESSAGES from '../messages';
import { OrgUnit, ParentOrgUnit } from '../../orgUnits/types/orgUnit';
import { baseUrls } from '../../../constants/urls';

const getParentCount = (
    orgUnit: AssignmentUnit | ParentOrgUnit,
    count = 0,
): number => {
    let newCount = count;
    if (orgUnit.parent) {
        newCount += 1 + getParentCount(orgUnit.parent, newCount);
    }
    return newCount;
};

type ParentHeadCellProps = {
    settings: any;
    index: number;
    params: AssignmentParams;
};

const baseUrl = baseUrls.assignments;

const ParentHeadCell: FunctionComponent<ParentHeadCellProps> = ({
    settings,
    index,
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const orgUnit = settings.data[index] as OrgUnit;
    const parent = get(
        orgUnit,
        `parent${'.parent'.repeat(index)}`,
    ) as ParentOrgUnit;
    const isActive = `${parent?.org_unit_type_id}` === params.parentOrgunitType;

    const toggleParentPicking = useCallback(
        (e: MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            dispatch(
                redirectTo(baseUrl, {
                    ...params,
                    parentPicking: isActive ? 'false' : 'true',
                    parentOrgunitType: isActive
                        ? ''
                        : `${parent.org_unit_type_id}`,
                }),
            );
        },
        [dispatch, isActive, params, parent?.org_unit_type_id],
    );
    return (
        <>
            {!parent &&
                formatMessage(MESSAGES.orgUnitsParent, {
                    index: index + 1,
                })}
            {parent && (
                <Box display="inline-block">
                    {parent.org_unit_type_name}
                    <Tooltip title={formatMessage(MESSAGES.parentOrgunitType)}>
                        <Checkbox
                            sx={{
                                position: 'relative',
                                top: -2,
                                p: 0.5,
                                ml: 1,
                            }}
                            size="small"
                            onBlur={e => e.stopPropagation()}
                            checked={
                                isActive && params.parentPicking === 'true'
                            }
                            onClick={toggleParentPicking}
                        />
                    </Tooltip>
                </Box>
            )}
        </>
    );
};

type Props = {
    orgUnits: Array<AssignmentUnit>;
    assignments: AssignmentsApi;
    teams: DropdownTeamsOptions[] | undefined;
    profiles: Profile[] | undefined;
    currentTeam?: Team;

    params: AssignmentParams;
};
export const useColumns = ({
    orgUnits,
    assignments,
    teams,
    profiles,
    currentTeam,
    params,
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
                    // @ts-ignore
                    Header: settings => (
                        <ParentHeadCell
                            index={index}
                            settings={settings}
                            params={params}
                        />
                    ),
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
        params,
        assignments,
        teams,
        profiles,
    ]);
};
