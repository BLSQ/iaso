import React, {
    FunctionComponent,
    ReactElement,
    useState,
    Dispatch,
    SetStateAction,
    useCallback,
} from 'react';
import { useDispatch } from 'react-redux';
import { Column, useSafeIntl } from 'bluesquare-components';
import { Box } from '@mui/material';
import { TableWithDeepLink } from '../../../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../constants/urls';
import {
    OrgUnitChangeRequestsPaginated,
    ApproveOrgUnitParams,
    OrgUnitChangeRequest,
    ChangeRequestValidationStatus,
} from '../types';
import { redirectTo } from '../../../../routing/actions';
import MESSAGES from '../messages';
import { LinkToOrgUnit } from '../../components/LinkToOrgUnit';
import { DateTimeCell } from '../../../../components/Cells/DateTimeCell';
import {
    ReviewOrgUnitChangesDialog,
    IconButton,
} from '../Dialogs/ReviewOrgUnitChangesDialog';
import { UserCell } from '../../../../components/Cells/UserCell';

type ColumnCell<T> = { row: { original: T; index: number } };

const getStatusColor = (status: ChangeRequestValidationStatus) => {
    switch (status) {
        case 'approved':
            return 'success.main';
        case 'rejected':
            return 'error.main';
        default:
            return 'inherit';
    }
};

const useColumns = (
    setSelectedChangeRequest: Dispatch<SetStateAction<SelectedChangeRequest>>,
): Column[] => {
    const { formatMessage } = useSafeIntl();
    return [
        {
            Header: 'id',
            id: 'id',
            accessor: 'id',
            width: 30,
        },
        {
            Header: formatMessage(MESSAGES.name),
            id: 'org_unit__name',
            accessor: 'org_unit_name',
            Cell: ({
                row: { original },
            }: ColumnCell<OrgUnitChangeRequest>): ReactElement => {
                return (
                    <LinkToOrgUnit
                        orgUnit={{
                            id: original.org_unit_id,
                            name: original.org_unit_name,
                        }}
                    />
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.orgUnitsType),
            id: 'org_unit__org_unit_type__name',
            accessor: 'org_unit_type_name',
        },
        {
            Header: formatMessage(MESSAGES.groups),
            id: 'groups',
            accessor: 'groups',
            sortable: false,
            Cell: ({
                row: { original: changeRequest },
            }: ColumnCell<OrgUnitChangeRequest>): ReactElement => {
                const { groups } = changeRequest;
                return (
                    <>
                        {groups.length > 0
                            ? groups.map(group => group.name).join(', ')
                            : '--'}
                    </>
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.status),
            id: 'status',
            accessor: 'status',
            Cell: ({
                value: status,
            }: {
                value: ChangeRequestValidationStatus;
            }): ReactElement => {
                return (
                    <>
                        {status && MESSAGES[status] ? (
                            <Box sx={{ color: getStatusColor(status) }}>
                                {formatMessage(MESSAGES[status])}
                            </Box>
                        ) : (
                            '--'
                        )}
                    </>
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
                row: { original: changeRequest, index },
            }: ColumnCell<OrgUnitChangeRequest>): ReactElement => {
                return (
                    <IconButton
                        changeRequestId={changeRequest.id}
                        status={changeRequest.status}
                        index={index}
                        setSelectedChangeRequest={setSelectedChangeRequest}
                    />
                );
            },
        },
    ];
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
    const dispatch = useDispatch();
    const [selectedChangeRequest, setSelectedChangeRequest] = useState<
        SelectedChangeRequest | undefined
    >();
    const columns = useColumns(setSelectedChangeRequest);
    const handleCloseDialog = useCallback(() => {
        setSelectedChangeRequest(undefined);
    }, []);
    return (
        <>
            {/* This dialog is at this level to keep selected request in state and allow further multiaction/pagination feature */}
            <ReviewOrgUnitChangesDialog
                isOpen={Boolean(selectedChangeRequest)}
                selectedChangeRequest={selectedChangeRequest}
                closeDialog={handleCloseDialog}
            />
            {/* @ts-ignore */}
            <TableWithDeepLink
                marginTop={false}
                data={data?.results ?? []}
                pages={data?.pages ?? 1}
                defaultSorted={[{ id: 'org_unit__name', desc: false }]}
                columns={columns}
                count={data?.count ?? 0}
                baseUrl={baseUrl}
                countOnTop={false}
                params={params}
                extraProps={{ loading: isFetching, selectedChangeRequest }}
                onTableParamsChange={p => {
                    dispatch(redirectTo(baseUrl, p));
                }}
            />
        </>
    );
};
