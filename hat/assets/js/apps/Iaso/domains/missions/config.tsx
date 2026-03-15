import React, { useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import { DateTimeCellRfc } from 'Iaso/components/Cells/DateTimeCell';
import { MissionActionsCell } from './components/MissionActionsCell';
import { useDeleteMission } from './hooks/requests/useDeleteMission';
import MESSAGES from './messages';
import { Mission, MissionFormEntry } from './types';

const formatMissionForms = (missionForms: MissionFormEntry[]): string => {
    if (!missionForms || missionForms.length === 0) return '-';
    return missionForms
        .map(mf => {
            const max = mf.max_cardinality ?? '∞';
            return `${mf.form.name} (${mf.min_cardinality}–${max})`;
        })
        .join(', ');
};

export const useMissionColumns = (params: any, count: number): Column[] => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: deleteMission } = useDeleteMission({
        params,
        count,
    });
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
                Header: formatMessage(MESSAGES.missionType),
                accessor: 'mission_type',
                id: 'mission_type',
                Cell: settings => {
                    const type = settings.row.original.mission_type;
                    return MESSAGES[type]
                        ? formatMessage(MESSAGES[type])
                        : type;
                },
            },
            {
                Header: formatMessage(MESSAGES.forms),
                accessor: 'mission_forms',
                sortable: false,
                Cell: settings =>
                    formatMissionForms(settings.row.original.mission_forms),
            },
            {
                Header: formatMessage(MESSAGES.orgUnitType),
                accessor: 'org_unit_type',
                sortable: false,
                Cell: settings =>
                    settings.row.original.org_unit_type?.name ?? '-',
            },
            {
                Header: formatMessage(MESSAGES.entityType),
                accessor: 'entity_type',
                sortable: false,
                Cell: settings =>
                    settings.row.original.entity_type?.name ?? '-',
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                accessor: 'created_at',
                id: 'created_at',
                Cell: DateTimeCellRfc,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                resizable: false,
                sortable: false,
                Cell: settings => (
                    <MissionActionsCell
                        {...settings}
                        deleteMission={deleteMission}
                    />
                ),
            },
        ],
        [formatMessage, deleteMission],
    );
};
