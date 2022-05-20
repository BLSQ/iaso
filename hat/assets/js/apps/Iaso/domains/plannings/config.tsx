import React, { ReactElement } from 'react';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import MESSAGES from './messages';
import { IntlFormatMessage } from '../../types/intl';
import { Column } from '../../types/table';
import { CreateEditPlanning } from './CreateEditPlanning/CreateEditPlanning';

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
            Cell: (settings): ReactElement => {
                return (
                    // TODO: limit to user permissions
                    <section>
                        <IconButtonComponent
                            url="/"
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.viewPlanning}
                        />
                        <CreateEditPlanning
                            type="copy"
                            name={settings.row.original?.name}
                            selectedTeam={settings.row.original?.team}
                            selectedOrgUnit={settings.row.original?.org_unit}
                            startDate={settings.row.original?.start_date}
                            endDate={settings.row.original?.end_date}
                            forms={settings.row.original?.forms ?? []}
                            publishingStatus={settings.row.original?.status}
                        />
                        <CreateEditPlanning
                            type="edit"
                            id={settings.row.original.id}
                            name={settings.row.original?.name}
                            selectedTeam={settings.row.original?.team}
                            selectedOrgUnit={settings.row.original?.org_unit}
                            startDate={settings.row.original?.start_date}
                            endDate={settings.row.original?.end_date}
                            forms={settings.row.original?.forms ?? []}
                            publishingStatus={settings.row.original?.status}
                        />
                    </section>
                );
            },
        },
    ];
};
