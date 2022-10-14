import React from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import MESSAGES from './messages';

import { LinkToOrgUnit } from '../orgUnits/components/LinkToOrgUnit';

import { IntlFormatMessage } from '../../types/intl';
import { Column } from '../../types/table';
import { baseUrls } from '../../constants/urls';
import { StorageParams } from './types/storages';

export const defaultSorted = [{ id: 'performed_at', desc: false }];

export const baseUrl = baseUrls.storages;

export const useGetColumns = (params: StorageParams): Array<Column> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const columns: Array<Column> = [
        {
            Header: 'Id',
            accessor: 'storage_id',
            width: 80,
        },
        {
            Header: formatMessage(MESSAGES.status),
            accessor: 'storage_status__status',
            id: 'storage_status__status',
            Cell: settings => {
                return settings.row.original?.storage_status ? (
                    <>
                        {formatMessage(
                            MESSAGES[
                                `${settings.row.original.storage_status.status}`
                            ],
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
                        icon="edit"
                        tooltipMessage={MESSAGES.edit}
                    />
                );
            },
        },
    ];
    if (!params.type) {
        columns.splice(1, 0, {
            Header: formatMessage(MESSAGES.type),
            accessor: 'storage_type',
            id: 'storage_type',
        });
    }
    return columns;
};
