import {
    Column,
    IconButton as IconButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import React, { ReactElement, useMemo } from 'react';
import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
import { DisplayIfUserHasPerm } from '../../components/DisplayIfUserHasPerm';
import { baseUrls } from '../../constants/urls';
import { PLANNING_WRITE } from '../../utils/permissions';
import { CreateEditPlanning } from './CreateEditPlanning/CreateEditPlanning';
import { PlanningApi } from './hooks/requests/useGetPlannings';
import MESSAGES from './messages';

const getAssignmentUrl = (planning: PlanningApi): string => {
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
                Cell: settings => settings.row.original.project_details.name,
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
                                size="small"
                            />
                            <DisplayIfUserHasPerm
                                permissions={[PLANNING_WRITE]}
                            >
                                <CreateEditPlanning
                                    type="edit"
                                    id={settings.row.original.id}
                                    name={settings.row.original?.name}
                                    selectedTeam={settings.row.original?.team}
                                    selectedOrgUnit={
                                        settings.row.original?.org_unit
                                    }
                                    startDate={
                                        settings.row.original?.started_at
                                    }
                                    endDate={settings.row.original?.ended_at}
                                    forms={settings.row.original?.forms ?? []}
                                    publishingStatus={
                                        settings.row.original?.status
                                    }
                                    project={settings.row.original?.project}
                                    description={
                                        settings.row.original?.description
                                    }
                                />
                            </DisplayIfUserHasPerm>
                            <DisplayIfUserHasPerm
                                permissions={[PLANNING_WRITE]}
                            >
                                <CreateEditPlanning
                                    type="copy"
                                    name={settings.row.original?.name}
                                    selectedTeam={settings.row.original?.team}
                                    selectedOrgUnit={
                                        settings.row.original?.org_unit
                                    }
                                    startDate={
                                        settings.row.original?.started_at
                                    }
                                    endDate={settings.row.original?.ended_at}
                                    forms={settings.row.original?.forms ?? []}
                                    publishingStatus={
                                        settings.row.original?.status
                                    }
                                    project={settings.row.original?.project}
                                    description={
                                        settings.row.original?.description
                                    }
                                />
                            </DisplayIfUserHasPerm>
                            <DisplayIfUserHasPerm
                                permissions={[PLANNING_WRITE]}
                            >
                                <DeleteDialog
                                    titleMessage={{
                                        ...MESSAGES.deletePlanning,
                                        values: {
                                            planningName:
                                                settings.row.original.name,
                                        },
                                    }}
                                    message={{
                                        ...MESSAGES.deleteWarning,
                                        values: {
                                            name: settings.row.original.name,
                                        },
                                    }}
                                    disabled={false}
                                    onConfirm={() =>
                                        deletePlanning(settings.row.original.id)
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
