import React, { FunctionComponent, MouseEvent, useCallback } from 'react';
import { Box, Divider } from '@mui/material';
import { useDispatch } from 'react-redux';
import get from 'lodash/get';

import { Column, Table } from 'bluesquare-components';

import { AssignmentsApi, AssignmentParams } from '../types/assigment';
import { AssignmentUnit } from '../types/locations';
import { useColumns } from '../configs/AssignmentsListTabColumns';
import { DropdownTeamsOptions, SubTeam, User, Team } from '../types/team';
import { Profile } from '../../../utils/usersUtils';

import { baseUrls } from '../../../constants/urls';
import { redirectTo } from '../../../routing/actions';
import { OrgUnit, ParentOrgUnit } from '../../orgUnits/types/orgUnit';
import { getStickyTableHeadStyles } from '../../../styles/utils';
import { parentColor } from '../constants/colors';

type Order = {
    id: string;
    desc: boolean;
};

type Orders = Array<Order>;

const getOrderArray = (orders: string | undefined): Orders => {
    if (!orders)
        return [
            {
                id: 'name',
                desc: false,
            },
        ];
    return orders.split(',').map(stringValue => ({
        id: stringValue.replace('-', ''),
        desc: stringValue.indexOf('-') !== -1,
    }));
};

type Props = {
    orgUnits?: Array<AssignmentUnit>;
    assignments: AssignmentsApi;
    isFetchingOrgUnits: boolean;
    params: AssignmentParams;
    handleSaveAssignment: (
        // eslint-disable-next-line no-unused-vars
        selectedOrgUnit: AssignmentUnit,
    ) => void;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    selectedItem: SubTeam | User | undefined;
    currentTeam?: Team;
    // eslint-disable-next-line no-unused-vars
    setParentSelected: (orgUnit: ParentOrgUnit | undefined) => void;
};

export const findParentWithOrgUnitTypeId = (
    parentOrgUnit: ParentOrgUnit,
    targetTypeId: string,
): ParentOrgUnit | undefined => {
    if (parentOrgUnit.org_unit_type_id.toString() === targetTypeId) {
        return parentOrgUnit;
    }
    if (parentOrgUnit.parent) {
        return findParentWithOrgUnitTypeId(parentOrgUnit.parent, targetTypeId);
    }
    return undefined;
};

const baseUrl = baseUrls.assignments;
export const AssignmentsListTab: FunctionComponent<Props> = ({
    orgUnits,
    isFetchingOrgUnits,
    handleSaveAssignment,
    assignments,
    teams,
    profiles,
    selectedItem,
    params,
    currentTeam,
    setParentSelected,
}: Props) => {
    const columns = useColumns({
        orgUnits: orgUnits || [],
        assignments,
        teams,
        profiles,
        currentTeam,
    });
    const dispatch = useDispatch();

    const handleClick = useCallback(
        (row: AssignmentUnit, event: MouseEvent<HTMLElement>) => {
            const target = event.target as HTMLElement;
            if (!(target instanceof HTMLAnchorElement) || !target.href) {
                if (
                    params.parentPicking === 'true' &&
                    params.parentOrgunitType
                ) {
                    const matchingParent = findParentWithOrgUnitTypeId(
                        row.parent,
                        params.parentOrgunitType,
                    );
                    if (matchingParent) {
                        setParentSelected(matchingParent);
                    }
                } else {
                    handleSaveAssignment(row);
                }
            }
        },
        [
            handleSaveAssignment,
            params.parentOrgunitType,
            params.parentPicking,
            setParentSelected,
        ],
    );

    const getCellProps = useCallback(
        cell => {
            const { id } = cell.column as Column;
            let backgroundColor = 'inherit';
            if (id?.includes('parent__')) {
                const orgUnit = cell.row.original as OrgUnit;
                const parent = get(
                    orgUnit,
                    id.replaceAll('__', '.').replace('.name', ''),
                ) as ParentOrgUnit;
                if (
                    parent &&
                    `${parent.org_unit_type_id}` === params.parentOrgunitType &&
                    params.parentPicking === 'true'
                ) {
                    backgroundColor = parentColor;
                }
            }
            return {
                style: {
                    backgroundColor,
                },
            };
        },
        [params.parentOrgunitType, params.parentPicking],
    );
    return (
        <Box sx={getStickyTableHeadStyles('67.8vh')}>
            <Divider />
            <Table
                elevation={0}
                data={orgUnits || []}
                showPagination={false}
                defaultSorted={getOrderArray(params.order)}
                countOnTop={false}
                marginTop={false}
                marginBottom={false}
                // @ts-ignore
                cellProps={getCellProps}
                columns={columns}
                count={orgUnits?.length ?? 0}
                extraProps={{
                    orgUnits,
                    loading: isFetchingOrgUnits || !orgUnits,
                    teams,
                    profiles,
                    assignments,
                    selectedItem,
                    parentOrgunitType: params.parentOrgunitType,
                    parentPicking: params.parentPicking,
                }}
                params={{ order: params.order }}
                // @ts-ignore
                onRowClick={handleClick}
                onTableParamsChange={p => {
                    const newParams = {
                        ...params,
                        order: p.order,
                    };
                    dispatch(redirectTo(baseUrl, newParams));
                }}
            />
            <Divider />
        </Box>
    );
};
