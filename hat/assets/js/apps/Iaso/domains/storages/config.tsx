/* eslint-disable camelcase */
import React from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import MESSAGES from './messages';

import { LinkToOrgUnit } from '../orgUnits/components/LinkToOrgUnit';
import { DateTimeCell } from '../../components/Cells/DateTimeCell';
import { StatusCell } from './components/StatusCell';
import { LinkToEntity } from './components/LinkToEntity';

import { IntlFormatMessage } from '../../types/intl';
import { Column } from '../../types/table';
import { baseUrls } from '../../constants/urls';
import { StorageParams } from './types/storages';

import { useGetOperationsTypesLabel } from './hooks/useGetOperationsTypes';

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
                const { status } = settings.row.original;
                return <StatusCell status={status} />;
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
            accessor: 'entity__name', // TODO this will not work as this field is not in use anymore
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
    return [
        {
            Header: formatMessage(MESSAGES.date),
            id: 'performed_at',
            accessor: 'performed_at',
            Cell: DateTimeCell,
        },
        {
            Header: formatMessage(MESSAGES.operationType),
            accessor: 'operation_type',
            id: 'operation_type',
            Cell: settings =>
                getOparationTypeLabel(settings.row.original.operation_type),
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
            accessor: 'entity__name', // TODO this will not work as this field is not in use anymore
            id: 'entity__name',
            Cell: settings => (
                <LinkToEntity entity={settings.row.original.entity} />
            ),
        },
    ];
};

useGetOperationsTypesLabel;
