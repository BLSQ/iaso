/* eslint-disable camelcase */
import React from 'react';
import {
    useSafeIntl,
    IconButton as IconButtonComponent,
    IntlFormatMessage,
    Column,
} from 'bluesquare-components';
import MESSAGES from './messages';

import { LinkToOrgUnit } from '../orgUnits/components/LinkToOrgUnit';
import { DateTimeCell } from '../../components/Cells/DateTimeCell';
import { StatusCell } from './components/StatusCell';
import { LinkToEntity } from './components/LinkToEntity';
import { LinkToInstance } from '../instances/components/LinkToInstance';
import { baseUrls } from '../../constants/urls';
import { StorageParams } from './types/storages';

import getDisplayName from '../../utils/usersUtils';

import { useGetOperationsTypesLabel } from './hooks/useGetOperationsTypes';
import { useGetReasons } from './hooks/useGetReasons';
import { useGetStatus } from './hooks/useGetStatus';

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
            Cell: settings => {
                const { storage_id } = settings.row.original;
                return <>{storage_id || '--'}</>;
            },
        },
        {
            Header: formatMessage(MESSAGES.status),
            accessor: 'status',
            id: 'status',
            Cell: settings => {
                const { storage_status } = settings.row.original;
                return <StatusCell status={storage_status} />;
            },
        },
        {
            Header: formatMessage(MESSAGES.location),
            accessor: 'org_unit__name',
            id: 'org_unit__name',
            Cell: settings => (
                <LinkToOrgUnit orgUnit={settings.row.original.org_unit} />
            ),
        },
        {
            Header: formatMessage(MESSAGES.entity),
            accessor: 'entity__name',
            id: 'entity__name',
            Cell: settings => (
                <LinkToEntity entity={settings.row.original.entity} />
            ),
        },
        {
            Header: formatMessage(MESSAGES.actions),
            resizable: false,
            sortable: false,
            accessor: 'actions',
            Cell: settings => {
                return (
                    <IconButtonComponent
                        url={`${baseUrls.storageDetail}/type/${settings.row.original.storage_type}/storageId/${settings.row.original.storage_id}`}
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
            Cell: settings => {
                const { storage_type } = settings.row.original;
                return <>{storage_type || '--'}</>;
            },
        });
    }
    return columns;
};

export const useGetDetailsColumns = (): Array<Column> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const getOparationTypeLabel = useGetOperationsTypesLabel();
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
            Cell: settings =>
                getDisplayName(settings.row.original.performed_by),
        },
        {
            Header: formatMessage(MESSAGES.operationType),
            accessor: 'operation_type',
            id: 'operation_type',
            Cell: settings =>
                getOparationTypeLabel(settings.row.original.operation_type),
        },
        {
            Header: formatMessage(MESSAGES.status),
            accessor: 'status',
            id: 'status',
            Cell: settings => {
                const log = settings.row.original;
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
            Cell: settings => {
                const log = settings.row.original;
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
            Cell: settings => {
                const log = settings.row.original;
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
            Cell: settings => {
                const { instances } = settings.row.original;
                if (instances.length === 0) return '-';
                return instances.map((instanceId, index) => (
                    <span key={instanceId}>
                        <LinkToInstance instanceId={instanceId} />
                        {index + 1 < instances.length && ', '}
                    </span>
                ));
            },
        },
        {
            Header: formatMessage(MESSAGES.location),
            accessor: 'org_unit__name',
            id: 'org_unit__name',
            Cell: settings => (
                <LinkToOrgUnit orgUnit={settings.row.original.org_unit} />
            ),
        },
        {
            Header: formatMessage(MESSAGES.entity),
            accessor: 'entity__name',
            id: 'entity__name',
            Cell: settings => (
                <LinkToEntity entity={settings.row.original.entity} />
            ),
        },
    ];
};

useGetOperationsTypesLabel;
