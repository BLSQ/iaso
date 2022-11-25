/* eslint-disable camelcase */
import React from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import MESSAGES from './messages';

import { IntlFormatMessage } from '../../types/intl';
import { Column } from '../../types/table';
import { baseUrls } from '../../constants/urls';

import { StatusCell } from './components/StatusCell';

export const defaultSorted = [{ id: 'version_id', desc: false }];

export const baseUrl = baseUrls.workflows;

export const useGetColumns = (): Array<Column> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const columns: Array<Column> = [
        {
            Header: formatMessage(MESSAGES.version),
            id: 'version_id',
            accessor: 'version_id',
        },
        {
            Header: formatMessage(MESSAGES.name),
            id: 'name',
            accessor: 'name',
        },
        {
            Header: formatMessage(MESSAGES.status),
            id: 'status',
            accessor: 'status',
            Cell: settings => {
                const { status } = settings.row.original;
                return <StatusCell status={status} />;
            },
        },
        {
            Header: formatMessage(MESSAGES.actions),
            resizable: false,
            sortable: false,
            accessor: 'actions',
            Cell: () => {
                return (
                    <IconButtonComponent
                        url={`${baseUrls.workflowDetail}/`}
                        icon="remove-red-eye"
                        tooltipMessage={MESSAGES.see}
                    />
                );
            },
        },
    ];
    return columns;
};
