import React from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';

import { LinkToOrgUnit } from '../orgUnits/components/LinkToOrgUnit';

import { IntlFormatMessage } from '../../types/intl';
import { Column } from '../../types/table';

export const defaultSorted = [{ id: 'performed_at', desc: false }];

export const useGetColumns = (): Array<Column> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return [
        {
            Header: 'Id',
            accessor: 'storage_id',
            width: 80,
        },
        {
            Header: formatMessage(MESSAGES.type),
            accessor: 'storage_type',
            id: 'storage_type',
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
    ];
};
