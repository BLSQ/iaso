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

import { IntlFormatMessage } from '../../types/intl';
import { Column } from '../../types/table';
import { baseUrls } from '../../constants/urls';
import { StorageParams } from './types/storages';

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
                return settings.row.original?.storage_id ? (
                    <>{settings.row.original?.storage_id}</>
                ) : (
                    <>--</>
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.status),
            accessor: 'status',
            id: 'status',
            Cell: settings => {
                return settings.row.original?.status ? (
                    <>
                        {formatMessage(
                            MESSAGES[`${settings.row.original.status.status}`],
                        )}
                    </>
                ) : (
                    <>--</>
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.location),
            accessor: 'org_unit__name',
            id: 'org_unit__name',
            Cell: settings => (
                <LinkToOrgUnit orgUnit={settings.row.original?.org_unit} />
            ),
        },
        {
            Header: formatMessage(MESSAGES.entity),
            accessor: 'entity__name', // TODO this will not work as this field is not in use anymore
            id: 'entity__name',
            Cell: settings => {
                return settings.row.original?.entity ? (
                    <>{settings.row.original.entity.name}</>
                ) : (
                    <>--</>
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.actions),
            resizable: false,
            sortable: false,
            accessor: 'actions',
            Cell: settings => {
                return (
                    <IconButtonComponent
                        url={`${baseUrls.storageDetail}/storageId/${settings.row.original.storage_id}`}
                        icon="remove-red-eye"
                        tooltipMessage={MESSAGES.see}
                    />
                );
            },
        },
    ];
    if (!params.type) {
        columns.splice(1, 0, {
            Header: formatMessage(MESSAGES.type),
            accessor: 'type',
            id: 'type',
            Cell: settings => {
                return settings.row.original?.storage_type ? (
                    <>{settings.row.original.storage_type}</>
                ) : (
                    <>--</>
                );
            },
        });
    }
    return columns;
};
