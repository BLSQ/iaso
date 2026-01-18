import React from 'react';
import {
    Column,
    IntlFormatMessage,
    useSafeIntl,
    IconButton as IconButtonComponent,
    Setting,
} from 'bluesquare-components';
import { DateTimeCell } from 'Iaso/components/Cells/DateTimeCell';
import { baseUrls } from 'Iaso/constants/urls';
import getDisplayName from '../../utils/usersUtils';
import { LinkToInstance } from '../instances/components/LinkToInstance';
import { LinkToOrgUnit } from '../orgUnits/components/LinkToOrgUnit';
import { LinkToEntity } from './components/LinkToEntity';
import { StatusCell } from './components/StatusCell';
import { useGetOperationsTypesLabel } from './hooks/useGetOperationsTypes';
import { useGetReasons } from './hooks/useGetReasons';
import { useGetStatus } from './hooks/useGetStatus';
import MESSAGES from './messages';
import { Log, Storage, StorageParams } from './types/storages';

export const defaultSorted = [{ id: 'updated_at', desc: false }];

export const baseUrl = baseUrls.storages;

export const useGetColumns = (params: StorageParams): Array<Column> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const columns: Array<Column> = [
        {
            Header: formatMessage(MESSAGES.last_sync_at),
            id: 'updated_at',
            accessor: 'updated_at',
            Cell: DateTimeCell,
        },
        {
            Header: 'Id',
            accessor: 'customer_chosen_id',
            id: 'customer_chosen_id',
            width: 80,
            Cell: ({ row: { original: storage } }: Setting<Storage>) => {
                return <span>{storage.storage_id || '--'}</span>;
            },
        },
        {
            Header: formatMessage(MESSAGES.status),
            accessor: 'status',
            id: 'status',
            Cell: ({ row: { original: storage } }: Setting<Storage>) => {
                return <StatusCell status={storage.storage_status} />;
            },
        },
        {
            Header: formatMessage(MESSAGES.location),
            accessor: 'org_unit__name',
            id: 'org_unit__name',
            Cell: ({ row: { original: storage } }: Setting<Storage>) => (
                <LinkToOrgUnit orgUnit={storage.org_unit} />
            ),
        },
        {
            Header: formatMessage(MESSAGES.entity),
            accessor: 'entity__name',
            id: 'entity__name',
            Cell: ({ row: { original: storage } }: Setting<Storage>) => (
                <LinkToEntity entity={storage.entity} />
            ),
        },
        {
            Header: formatMessage(MESSAGES.actions),
            resizable: false,
            sortable: false,
            accessor: 'actions',
            Cell: ({ row: { original: storage } }: Setting<Storage>) => {
                const url = `/${baseUrls.storageDetail}/type/${storage.storage_type}/storageId/${storage.id}`;
                return (
                    <IconButtonComponent
                        url={url}
                        icon="remove-red-eye"
                        tooltipMessage={MESSAGES.see}
                    />
                );
            },
        },
    ];
    if (!params.type || (params.type && params.type.split(',').length > 1)) {
        columns.splice(1, 0, {
            Header: formatMessage(MESSAGES.type),
            accessor: 'type',
            id: 'type',
            Cell: ({ row: { original: storage } }: Setting<Storage>) => {
                return <span>{storage.storage_type || '--'}</span>;
            },
        });
    }
    return columns;
};

export const useGetDetailsColumns = (): Array<Column> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const getOperationTypeLabel = useGetOperationsTypesLabel();
    const reasons = useGetReasons();
    const statusList = useGetStatus();
    return [
        {
            Header: formatMessage(MESSAGES.date),
            id: 'performed_at',
            accessor: 'performed_at',
            Cell: DateTimeCell,
        },
        {
            Header: formatMessage(MESSAGES.user),
            id: 'performed_by',
            accessor: 'performed_by',
            Cell: ({ row: { original: log } }: Setting<Log>) =>
                getDisplayName(log.performed_by),
        },
        {
            Header: formatMessage(MESSAGES.operationType),
            accessor: 'operation_type',
            id: 'operation_type',
            Cell: ({ row: { original: log } }: Setting<Log>) =>
                getOperationTypeLabel(log.operation_type),
        },
        {
            Header: formatMessage(MESSAGES.status),
            accessor: 'status',
            id: 'status',
            Cell: ({ row: { original: log } }: Setting<Log>) => {
                if (log.operation_type === 'CHANGE_STATUS' && log.status) {
                    const status = statusList.find(
                        stat => stat.value === log.status,
                    );
                    return status?.label || '-';
                }
                return '-';
            },
        },
        {
            Header: formatMessage(MESSAGES.reason),
            accessor: 'status_reason',
            id: 'status_reason',
            Cell: ({ row: { original: log } }: Setting<Log>) => {
                if (
                    log.operation_type === 'CHANGE_STATUS' &&
                    log.status === 'BLACKLISTED'
                ) {
                    const reason = reasons.find(
                        reas => reas.value === log.status_reason,
                    );
                    return reason?.label || '-';
                }
                return '-';
            },
        },
        {
            Header: formatMessage(MESSAGES.comment),
            accessor: 'status_comment',
            id: 'status_comment',
            Cell: ({ row: { original: log } }: Setting<Log>) => {
                if (log.operation_type === 'CHANGE_STATUS') {
                    return log.status_comment && log.status_comment !== ''
                        ? log.status_comment
                        : '-';
                }
                return '-';
            },
        },
        {
            Header: formatMessage(MESSAGES.submissions),
            accessor: 'instances',
            id: 'instances',
            Cell: ({ row: { original: log } }: Setting<Log>) => {
                const { instances } = log;
                if (instances.length === 0) return <>-</>;
                return (
                    <>
                        {instances.map((instanceId: number, index: number) => (
                            <span key={instanceId}>
                                <LinkToInstance
                                    instanceId={instanceId.toString()}
                                />
                                {index + 1 < instances.length && ', '}
                            </span>
                        ))}
                    </>
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.location),
            accessor: 'org_unit__name',
            id: 'org_unit__name',
            Cell: ({ row: { original: log } }: Setting<Log>) => (
                <LinkToOrgUnit orgUnit={log.org_unit} />
            ),
        },
        {
            Header: formatMessage(MESSAGES.entity),
            accessor: 'entity__name',
            id: 'entity__name',
            Cell: ({ row: { original: log } }: Setting<Log>) => (
                <LinkToEntity entity={log.entity} />
            ),
        },
    ];
};
