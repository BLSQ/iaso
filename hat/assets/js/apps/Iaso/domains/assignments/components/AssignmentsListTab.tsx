import React, { FunctionComponent, MouseEvent, useCallback } from 'react';
import { Box, Divider } from '@mui/material';
import { Column, Table, useRedirectTo } from 'bluesquare-components';
import Color from 'color';
import get from 'lodash/get';
import { baseUrls } from '../../../constants/urls';
import { getStickyTableHeadStyles } from '../../../styles/utils';
import { Profile } from '../../../utils/usersUtils';
import { OrgUnit, ParentOrgUnit } from '../../orgUnits/types/orgUnit';
import {
    DropdownTeamsOptions,
    SubTeam,
    Team,
    User,
} from '../../teams/types/team';
import { useColumns } from '../configs/AssignmentsListTabColumns';
import { parentColor } from '../constants/colors';
import { AssignmentParams, AssignmentsApi } from '../types/assigment';
import { AssignmentUnit } from '../types/locations';

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
    handleSaveAssignment: (selectedOrgUnit: AssignmentUnit) => void;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    selectedItem: SubTeam | User | undefined;
    currentTeam?: Team;
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
        params,
    });
    const redirectTo = useRedirectTo();

    const handleClick = useCallback(
        (row: AssignmentUnit, event: MouseEvent<HTMLElement>) => {
            const target = event.target as HTMLElement;
            if (!(target instanceof HTMLAnchorElement) || !target.href) {
                if (params.parentOrgunitType) {
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
        [handleSaveAssignment, params.parentOrgunitType, setParentSelected],
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
                    `${parent.org_unit_type_id}` === params.parentOrgunitType
                ) {
                    backgroundColor = Color(parentColor).fade(0.7);
                }
            }
            return {
                style: {
                    backgroundColor,
                },
            };
        },
        [params.parentOrgunitType],
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
                }}
                params={{ order: params.order }}
                onRowClick={handleClick}
                onTableParamsChange={p => {
                    const newParams = {
                        ...params,
                        order: p.order,
                    };
                    redirectTo(baseUrl, newParams);
                }}
            />
            <Divider />
        </Box>
    );
};
