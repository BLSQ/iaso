/* eslint-disable camelcase */
import React from 'react';
import { useSafeIntl, Column, IntlFormatMessage } from 'bluesquare-components';

import MESSAGES from '../messages';

import { baseUrls } from '../../../constants/urls';

import { StatusCell } from '../components/StatusCell';
import { VersionsActionCell } from '../components/versions/ActionCell';

export const defaultSorted = [{ id: 'id', desc: true }];

export const baseUrl = baseUrls.workflows;

export const useGetColumns = (entityTypeId: string): Array<Column> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const columns: Array<Column> = [
        {
            Header: formatMessage(MESSAGES.version),
            id: 'id',
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
            Cell: settings => (
                <VersionsActionCell
                    workflowVersion={settings.row.original}
                    entityTypeId={parseInt(entityTypeId, 10)}
                />
            ),
        },
    ];
    return columns;
};
