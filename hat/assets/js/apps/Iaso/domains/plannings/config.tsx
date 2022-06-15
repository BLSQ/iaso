import React, { ReactElement } from 'react';
// @ts-ignore
import { IconButton as IconButtonComponent } from 'bluesquare-components';

import { baseUrls } from '../../constants/urls';

import { IntlFormatMessage } from '../../types/intl';
import { Column } from '../../types/table';

import { CreateEditPlanning } from './CreateEditPlanning/CreateEditPlanning';

import MESSAGES from './messages';

import { PlanningApi } from './hooks/requests/useGetPlannings';

const getAssignmentUrl = (planning: PlanningApi): string => {
    return `${baseUrls.assignments}/planningId/${planning.id}/team/${planning.team}`;
};

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
            accessor: 'started_at',
            id: 'started_at',
        },
        {
            Header: formatMessage(MESSAGES.endDate),
            accessor: 'ended_at',
            id: 'ended_at',
        },
        {
            Header: formatMessage(MESSAGES.team),
            accessor: 'team',
            id: 'team',
            Cell: settings => settings.row.original.team_details.name,
        },
        {
            Header: formatMessage(MESSAGES.published),
            accessor: 'status',
            id: 'status',
            Cell: settings => {
                if (settings.row.original.status === 'published')
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
                            url={getAssignmentUrl(settings.row.original)}
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.viewPlanning}
                        />
                        <CreateEditPlanning
                            type="edit"
                            id={settings.row.original.id}
                            name={settings.row.original?.name}
                            selectedTeam={settings.row.original?.team}
                            selectedOrgUnit={settings.row.original?.org_unit}
                            startDate={settings.row.original?.started_at}
                            endDate={settings.row.original?.ended_at}
                            forms={settings.row.original?.forms ?? []}
                            publishingStatus={settings.row.original?.status}
                            project={settings.row.original?.project}
                            description={settings.row.original?.description}
                        />
                        <CreateEditPlanning
                            type="copy"
                            name={settings.row.original?.name}
                            selectedTeam={settings.row.original?.team}
                            selectedOrgUnit={settings.row.original?.org_unit}
                            startDate={settings.row.original?.started_at}
                            endDate={settings.row.original?.ended_at}
                            forms={settings.row.original?.forms ?? []}
                            publishingStatus={settings.row.original?.status}
                            project={settings.row.original?.project}
                            description={settings.row.original?.description}
                        />
                    </section>
                );
            },
        },
    ];
};
