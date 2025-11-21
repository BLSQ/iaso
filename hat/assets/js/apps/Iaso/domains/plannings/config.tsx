import React, { ReactElement, useMemo } from 'react';
import {
    Column,
    IconButton as IconButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import { ColumnCell } from 'Iaso/types/general';
import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
import { DisplayIfUserHasPerm } from '../../components/DisplayIfUserHasPerm';
import { baseUrls } from '../../constants/urls';
import { PLANNING_WRITE } from '../../utils/permissions';
import { Planning } from '../assignments/types/planning';
import { ProjectChip } from '../projects/components/ProjectChip';
import { TeamChip } from '../teams/components/TeamChip';
import { EditPlanning, DuplicatePlanning } from './components/PlanningDialog';
import { PlanningStatusChip } from './components/PlanningStatusChip';
import MESSAGES from './messages';

const getAssignmentUrl = (planning: Planning): string => {
    return `/${baseUrls.assignments}/planningId/${planning.id}/team/${planning.team}`;
};
export const usePlanningColumns = (
    deletePlanning: (id: number) => void,
): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
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
                Header: formatMessage(MESSAGES.publishingStatus),
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
                Cell: ({
                    row: { original: planning },
                }: ColumnCell<Planning>): ReactElement => {
                    return (
                        // TODO: limit to user permissions
                        <section>
                            <IconButtonComponent
                                url={getAssignmentUrl(planning)}
                                icon="remove-red-eye"
                                tooltipMessage={MESSAGES.viewPlanning}
                                size="small"
                            />
                            <DisplayIfUserHasPerm
                                permissions={[PLANNING_WRITE]}
                            >
                                <EditPlanning
                                    type="edit"
                                    iconProps={{}}
                                    planning={planning}
                                />
                            </DisplayIfUserHasPerm>
                            <DisplayIfUserHasPerm
                                permissions={[PLANNING_WRITE]}
                            >
                                <DuplicatePlanning
                                    iconProps={{}}
                                    type="copy"
                                    planning={planning}
                                />
                            </DisplayIfUserHasPerm>
                            <DisplayIfUserHasPerm
                                permissions={[PLANNING_WRITE]}
                            >
                                <DeleteDialog
                                    titleMessage={{
                                        ...MESSAGES.deletePlanning,
                                        values: {
                                            planningName: planning.name,
                                        },
                                    }}
                                    message={{
                                        ...MESSAGES.deleteWarning,
                                        values: {
                                            name: planning.name,
                                        },
                                    }}
                                    disabled={false}
                                    onConfirm={() =>
                                        deletePlanning(planning.id)
                                    }
                                    keyName="delete-planning"
                                />
                            </DisplayIfUserHasPerm>
                        </section>
                    );
                },
            },
        ],
        [deletePlanning, formatMessage],
    );
};
