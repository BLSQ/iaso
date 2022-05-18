import React, { ReactElement } from 'react';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import MESSAGES from './messages';
import { IntlFormatMessage } from '../../types/intl';
import { Column } from '../../types/table';

export const planningColumns = (formatMessage: IntlFormatMessage): Column[] => {
    return [
        {
            Header: 'Id',
            accessor: 'id',
            width: 80,
        },
        {
            Header: formatMessage(MESSAGES.name),
            accessor: 'name',
            id: 'name',
        },
        {
            Header: formatMessage(MESSAGES.startDate),
            accessor: 'start_date',
            id: 'start_date',
        },
        {
            Header: formatMessage(MESSAGES.endDate),
            accessor: 'end_date',
            id: 'end_date',
        },
        {
            Header: formatMessage(MESSAGES.team),
            accessor: 'team',
            id: 'team',
            Cell: settings => settings.row.original.name,
        },
        {
            Header: formatMessage(MESSAGES.published),
            accessor: 'status',
            id: 'status',
            Cell: settings => {
                if (settings.row.original.status)
                    return formatMessage(MESSAGES.yes);
                return formatMessage(MESSAGES.no);
            },
        },
        {
            Header: formatMessage(MESSAGES.actions),
            accessor: 'actions',
            resizable: false,
            sortable: false,
            Cell: (settings): ReactElement => (
                // TODO: limit to user permissions
                <section>
                    <IconButtonComponent
                        url="/"
                        icon="remove-red-eye"
                        tooltipMessage={MESSAGES.viewPlanning}
                    />
                    <IconButtonComponent
                        url="/"
                        overrideIcon={FileCopyIcon}
                        tooltipMessage={MESSAGES.duplicatePlanning}
                    />
                    <IconButtonComponent
                        url="/"
                        icon="edit"
                        tooltipMessage={MESSAGES.edit}
                    />
                </section>
            ),
        },
    ];
};
