import React, {
    FunctionComponent,
    ReactElement,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { useDispatch } from 'react-redux';
import {
    Column,
    useSafeIntl,
    selectionInitialState,
    setTableSelection,
} from 'bluesquare-components';
import CheckIcon from '@material-ui/icons/Check';
import { TableWithDeepLink } from '../../../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../constants/urls';
import {
    OrgUnitChangeRequestsPaginated,
    ApproveOrgUnitParams,
    NestedUser,
    OrgUnitChangeRequest,
    OrgUnitValidationStatus,
} from '../types';
import { redirectTo } from '../../../../routing/actions';
import MESSAGES from '../messages';
import { LinkToOrgUnit } from '../../components/LinkToOrgUnit';
import { DateTimeCell } from '../../../../components/Cells/DateTimeCell';
import getDisplayName from '../../../../utils/usersUtils';
import { Selection } from '../../types/selection';

type ColumnCell<T> = { row: { original: T } };

const useColumns = (): Column[] => {
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
                            id: original.id,
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
                value: OrgUnitValidationStatus;
            }): ReactElement => {
                return (
                    <>
                        {status && MESSAGES[status]
                            ? formatMessage(MESSAGES[status])
                            : '--'}
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
            Cell: ({
                value: createdBy,
            }: {
                value: NestedUser;
            }): ReactElement => (
                <>{createdBy ? getDisplayName(createdBy) : '--'}</>
            ),
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
            Cell: ({
                value: updatedBy,
            }: {
                value: NestedUser;
            }): ReactElement => (
                <>{updatedBy ? getDisplayName(updatedBy) : '--'}</>
            ),
        },
        {
            Header: formatMessage(MESSAGES.actions),
            id: 'actions',
            accessor: 'actions',
            sortable: false,
            Cell: ({
                row: { original: changeRequest },
            }: ColumnCell<OrgUnitChangeRequest>): ReactElement => {
                return <>{changeRequest.id}</>;
            },
        },
    ];
};

type Props = {
    data: OrgUnitChangeRequestsPaginated | undefined;
    isFetching: boolean;
    params: ApproveOrgUnitParams;
};
export const baseUrl = baseUrls.orgUnitsChangeRequest;
export const ApproveOrgUnitChangesTable: FunctionComponent<Props> = ({
    data,
    isFetching,
    params,
}) => {
    const dispatch = useDispatch();
    const columns = useColumns();
    const { formatMessage } = useSafeIntl();
    const [selection, setSelection] = useState<Selection<OrgUnitChangeRequest>>(
        selectionInitialState,
    );
    console.log('selection', selection);
    const [openDialog, setOpenDialog] = useState<boolean>(false);
    const multiEditDisabled =
        !selection.selectAll && selection.selectedItems.length === 0;
    const selectionActions = useMemo(
        () => [
            {
                icon: <CheckIcon />,
                label: formatMessage(MESSAGES.multiSelectionAction),
                onClick: () => setOpenDialog(true),
                disabled: multiEditDisabled,
            },
        ],
        [formatMessage, multiEditDisabled],
    );
    const handleTableSelection = useCallback(
        (selectionType, items = [], totalCount = 0) => {
            const newSelection: Selection<OrgUnitChangeRequest> =
                setTableSelection(selection, selectionType, items, totalCount);
            setSelection(newSelection);
        },
        [selection],
    );
    return (
        <>
            {openDialog && 'OPEN DIALOG'}
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
                extraProps={{ loading: isFetching }}
                onTableParamsChange={p => {
                    dispatch(redirectTo(baseUrl, p));
                }}
                multiSelect
                selection={selection}
                selectionActions={selectionActions}
                //  @ts-ignore
                setTableSelection={(selectionType, items, totalCount) =>
                    handleTableSelection(selectionType, items, totalCount)
                }
            />
        </>
    );
};
