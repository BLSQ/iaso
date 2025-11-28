import React, { useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';

import { ProjectChip } from '../projects/components/ProjectChip';
import { TeamChip } from '../teams/components/TeamChip';
import { ActionsCell } from './components/ActionsCell';
import { PlanningStatusChip } from './components/PlanningStatusChip';
import MESSAGES from './messages';

export const usePlanningColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo<Column[]>(
        () => [
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
                Header: formatMessage(MESSAGES.project),
                accessor: 'project__name',
                id: 'project__name',
                Cell: settings => (
                    <ProjectChip
                        project={settings.row.original.project_details}
                    />
                ),
            },
            {
                Header: formatMessage(MESSAGES.orgUnit),
                accessor: 'org_unit__name',
                id: 'org_unit__name',
                Cell: settings => settings.row.original.org_unit_details.name,
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
                Cell: settings => (
                    <TeamChip team={settings.row.original.team_details} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.status),
                accessor: 'status',
                id: 'status',
                Cell: settings => (
                    <PlanningStatusChip status={settings.row.original.status} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                resizable: false,
                sortable: false,
                Cell: settings => <ActionsCell {...settings} />,
            },
        ],
        [formatMessage],
    );
};
