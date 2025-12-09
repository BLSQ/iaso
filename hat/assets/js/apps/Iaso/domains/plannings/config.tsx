import React, { useMemo } from 'react';
import { Column, formatThousand, useSafeIntl } from 'bluesquare-components';

import { DateTimeCell } from 'Iaso/components/Cells/DateTimeCell';
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
export const useSamplingResultsColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo<Column[]>(
        () => [
            {
                Header: 'Id',
                accessor: 'id',
                width: 80,
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                accessor: 'created_at',
                id: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: 'Pipeline',
                accessor: 'pipeline_name',
            },
            {
                Header: formatMessage(MESSAGES.orgUnitsCount),
                accessor: 'group_details_org_unit_count',
                id: 'group_details_org_unit_count',
                sortable: false,
                Cell: settings =>
                    // -1 to remove root org unit from the count
                    formatThousand(
                        settings.row.original.group_details.org_unit_count - 1,
                    ),
            },
        ],
        [formatMessage],
    );
};
