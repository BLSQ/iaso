import React, {
    FunctionComponent,
    ReactElement,
    useMemo,
    useState,
} from 'react';
import EditIcon from '@mui/icons-material/Settings';
import { Box } from '@mui/material';
import { Column, textPlaceholder, useSafeIntl } from 'bluesquare-components';

import Color from 'color';
import { BreakWordCell } from '../../../../components/Cells/BreakWordCell';
import { DateTimeCell } from '../../../../components/Cells/DateTimeCell';
import { UserCell } from '../../../../components/Cells/UserCell';
import { TableWithDeepLink } from '../../../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../constants/urls';
import { ColumnCell } from '../../../../types/general';
import { useTableSelection } from '../../../../utils/table';
import { LinkToOrgUnit } from '../../components/LinkToOrgUnit';
import { MultiActionsDialog } from '../Components/MultiActionsDialog';
import { colorCodes } from '../Components/ReviewOrgUnitChangesInfos';
import { IconButton } from '../details';
import MESSAGES from '../messages';
import {
    ApproveOrgUnitParams,
    ChangeRequestValidationStatus,
    OrgUnitChangeRequest,
    OrgUnitChangeRequestsPaginated,
} from '../types';

const getIsSelectionDisabled = (ou: OrgUnitChangeRequest) =>
    ou.status !== 'new';

const useColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
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
        ],
        [formatMessage],
    );
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

    const { selection, handleTableSelection, handleUnselectAll } =
        useTableSelection<OrgUnitChangeRequest>(data?.count ?? 0);

    const [multiActionPopupOpen, setMultiActionPopupOpen] =
        useState<boolean>(false);
    const { formatMessage } = useSafeIntl();

    const selectionActions = useMemo(
        () => [
            {
                icon: <EditIcon />,
                label: formatMessage(MESSAGES.multiSelectionAction),
                onClick: () => setMultiActionPopupOpen(true),
                disabled:
                    multiActionPopupOpen ||
                    (selection.selectedItems.length === 0 &&
                        !selection.selectAll),
            },
        ],
        [
            formatMessage,
            multiActionPopupOpen,
            selection.selectAll,
            selection.selectedItems.length,
        ],
    );
    return (
        <>
            <MultiActionsDialog
                open={multiActionPopupOpen}
                closeDialog={() => setMultiActionPopupOpen(false)}
                selection={selection}
                resetSelection={handleUnselectAll}
            />
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
                multiSelect={Boolean(
                    data?.select_all_count && data?.select_all_count > 0,
                )}
                selection={selection}
                selectionActions={selectionActions}
                selectAllCount={data?.select_all_count ?? 0}
                getIsSelectionDisabled={getIsSelectionDisabled}
                setTableSelection={(selectionType, items, totalCount) =>
                    handleTableSelection(selectionType, items, totalCount)
                }
            />
        </>
    );
};
