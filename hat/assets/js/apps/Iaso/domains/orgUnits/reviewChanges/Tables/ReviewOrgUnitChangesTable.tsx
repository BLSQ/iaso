import React, { FunctionComponent, ReactElement, useMemo } from 'react';
import { Box } from '@mui/material';
import { Column, textPlaceholder, useSafeIntl } from 'bluesquare-components';
import Color from 'color';
import { BreakWordCell } from '../../../../components/Cells/BreakWordCell';
import { DateTimeCell } from '../../../../components/Cells/DateTimeCell';
import { UserCell } from '../../../../components/Cells/UserCell';
import { TableWithDeepLink } from '../../../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../constants/urls';
import { ColumnCell } from '../../../../types/general';
import { useCurrentUser } from '../../../../utils/usersUtils';
import { LinkToOrgUnit } from '../../components/LinkToOrgUnit';
import { colorCodes } from '../Components/ReviewOrgUnitChangesInfos';
import { PAYMENTS_MODULE } from '../constants';
import { IconButton } from '../details';
import MESSAGES from '../messages';
import {
    ApproveOrgUnitParams,
    ChangeRequestValidationStatus,
    OrgUnitChangeRequest,
    OrgUnitChangeRequestsPaginated,
} from '../types';

const useColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const { modules } = currentUser.account;

    return useMemo(() => {
        const columns = [
            {
                Header: 'id',
                id: 'id',
                accessor: 'id',
                width: 30,
            },
            {
                Header: formatMessage(MESSAGES.projects),
                id: 'projects',
                accessor: 'projects',
                sortable: false,
                Cell: ({
                    row: { original: changeRequest },
                }: ColumnCell<OrgUnitChangeRequest>): ReactElement | string => {
                    const { projects } = changeRequest;
                    return projects.length > 0
                        ? projects.map(project => project.name).join(', ')
                        : textPlaceholder;
                },
            },
            {
                Header: formatMessage(MESSAGES.name),
                id: 'org_unit__name',
                accessor: 'org_unit_name',
                Cell: ({
                    row: { original },
                }: ColumnCell<OrgUnitChangeRequest>): ReactElement => {
                    if (original.org_unit_name) {
                        return (
                            <LinkToOrgUnit
                                orgUnit={{
                                    id: original.org_unit_id,
                                    name: original.org_unit_name,
                                }}
                            />
                        );
                    }
                    return <>{formatMessage(MESSAGES.newOrgUnit)}</>;
                },
            },
            {
                Header: formatMessage(MESSAGES.parent),
                id: 'org_unit__parent__name',
                accessor: 'org_unit_parent_name',
                Cell: settings => {
                    const parentId = settings.row.original?.org_unit_parent_id;
                    const parentName =
                        settings.row.original?.org_unit_parent_name;
                    return parentId && parentName ? (
                        <LinkToOrgUnit
                            orgUnit={{
                                id: parentId,
                                name: parentName,
                            }}
                        />
                    ) : (
                        textPlaceholder
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.orgUnitsType),
                id: 'org_unit__org_unit_type__name',
                accessor: 'org_unit_type_name',
            },
            {
                Header: formatMessage(MESSAGES.status),
                id: 'status',
                accessor: 'status',
                Cell: ({
                    value: status,
                }: {
                    value: ChangeRequestValidationStatus;
                }): ReactElement | string => {
                    return status && MESSAGES[status] ? (
                        <Box sx={{ color: `${colorCodes[status]}.main` }}>
                            {formatMessage(MESSAGES[status])}
                        </Box>
                    ) : (
                        textPlaceholder
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                id: 'created_at',
                accessor: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.created_by),
                id: 'created_by__username',
                accessor: 'created_by',
                Cell: UserCell,
            },
            {
                Header: formatMessage(MESSAGES.paymentStatus),
                id: 'payment_status',
                accessor: 'payment_status',
                Cell: BreakWordCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_at),
                id: 'updated_at',
                accessor: 'updated_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_by),
                id: 'updated_by__username',
                accessor: 'updated_by',
                Cell: UserCell,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                id: 'actions',
                accessor: 'actions',
                sortable: false,
                Cell: ({
                    row: { original: changeRequest },
                }: ColumnCell<OrgUnitChangeRequest>): ReactElement => {
                    return (
                        <IconButton
                            changeRequestId={changeRequest.id}
                            status={changeRequest.status}
                        />
                    );
                },
            },
        ];

        // Remove payment status column when the current account has no payments module
        if (!modules.includes(PAYMENTS_MODULE)) {
            return columns.filter(column => column.id !== 'payment_status');
        }

        return columns;
    }, [formatMessage, modules]);
};

const getRowProps = (row: { original: OrgUnitChangeRequest }) => {
    if (
        row.original.org_unit_validation_status === 'NEW' &&
        row.original.status === 'new'
    ) {
        return {
            'data-test': 'new-org-unit-row',
            sx: {
                backgroundColor: theme =>
                    `${Color(theme.palette.yellow.main).fade(0.5)} !important`,
            },
        };
    }
    return {
        'data-test': 'change-request-row',
    };
};

export type SelectedChangeRequest = {
    id: number;
    index: number;
};

type Props = {
    data: OrgUnitChangeRequestsPaginated | undefined;
    isFetching: boolean;
    params: ApproveOrgUnitParams;
};
export const baseUrl = baseUrls.orgUnitsChangeRequest;
export const ReviewOrgUnitChangesTable: FunctionComponent<Props> = ({
    data,
    isFetching,
    params,
}) => {
    const columns = useColumns();

    return (
        <TableWithDeepLink
            marginTop={false}
            data={data?.results ?? []}
            pages={data?.pages ?? 1}
            defaultSorted={[{ id: 'updated_at', desc: true }]}
            columns={columns}
            count={data?.count ?? 0}
            baseUrl={baseUrl}
            countOnTop
            params={params}
            rowProps={getRowProps}
            extraProps={{ loading: isFetching }}
        />
    );
};
