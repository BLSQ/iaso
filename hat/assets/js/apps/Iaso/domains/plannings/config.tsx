import React, { FunctionComponent, useMemo } from 'react';
import {
    Column,
    formatThousand,
    IconButton,
    makeRedirectionUrl,
    useSafeIntl,
} from 'bluesquare-components';

import { DateTimeCell } from 'Iaso/components/Cells/DateTimeCell';
import { baseUrls } from 'Iaso/constants/urls';
import { useGetColors } from 'Iaso/hooks/useGetColors';
import { getColor } from 'Iaso/hooks/useGetColors';
import { encodeUriSearches } from '../orgUnits/utils';
import { ProjectChip } from '../projects/components/ProjectChip';
import { TeamChip } from '../teams/components/TeamChip';
import { ActionsCell } from './components/ActionsCell';
import { PlanningStatusChip } from './components/PlanningStatusChip';
import MESSAGES from './messages';
import { Planning, SamplingResult } from './types';
import { BreakWordCell } from 'Iaso/components/Cells/BreakWordCell';

type Props = {
    samplingResult: SamplingResult;
    planning: Planning;
};

const ActionCell: FunctionComponent<Props> = ({ samplingResult, planning }) => {
    const { data: colors } = useGetColors(true);
    const greenColor = getColor(31, colors).replace('#', '');
    const purpleColor = getColor(3, colors).replace('#', '');
    const urlParams: Record<string, any> = useMemo(
        () => ({
            locationLimit: 50000,
            order: 'id',
            pageSize: 50,
            page: 1,
            searchTabIndex: 0,
            searchActive: true,
            tab: 'map',
            isClusterActive: false,
            searches: encodeUriSearches([
                {
                    validation_status: 'VALID',
                    color: greenColor,
                    levels: `${planning.org_unit}`,
                    orgUnitTypeId: `${planning.target_org_unit_type}`,
                },
                {
                    validation_status: 'VALID',
                    color: purpleColor,
                    group: `${samplingResult.group_id}`,
                    orgUnitTypeId: `${planning.target_org_unit_type}`,
                },
            ]),
        }),
        [greenColor, purpleColor, planning, samplingResult],
    );

    return (
        <IconButton
            url={makeRedirectionUrl(baseUrls.orgUnits, urlParams)}
            icon="remove-red-eye"
            tooltipMessage={MESSAGES.seeSamplingResults}
        />
    );
};

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
export const useSamplingResultsColumns = (planning: Planning): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo<Column[]>(
        () => [
            {
                Header: 'Id',
                accessor: 'id',
                width: 80,
            },
            {
                Header: 'Sampling Name',
                accessor: 'group_details.name',
                Cell: BreakWordCell,
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
                    formatThousand(
                        settings.row.original.group_details.org_unit_count,
                    ),
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                sortable: false,
                Cell: settings => (
                    <ActionCell
                        samplingResult={settings.row.original}
                        planning={planning}
                    />
                ),
            },
        ],
        [formatMessage, planning],
    );
};
