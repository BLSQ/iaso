import React, { useMemo } from 'react';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import { ProjectChips } from 'Iaso/domains/projects/components/ProjectChips';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell.tsx';
import { baseUrls } from '../../../constants/urls.ts';
import * as Permission from '../../../utils/permissions.ts';
import { useCurrentUser } from '../../../utils/usersUtils.ts';
import {
    userHasAccessToModule,
    userHasOneOfPermissions,
    userHasPermission,
} from '../../users/utils';
import { FormActions } from '../components/FormActions.tsx';
import FormVersionsDialog from '../components/FormVersionsDialogComponent';
import MESSAGES from '../messages';
import { UserCell } from 'Iaso/components/Cells/UserCell';

export const baseUrl = baseUrls.forms;

export const useFormVersionsTableColumns = (formId, periodType) => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.version),
                accessor: 'version_id',
            },
            {
                Header: formatMessage(MESSAGES.startPeriod),
                accessor: 'start_period',
            },
            {
                Header: formatMessage(MESSAGES.endPeriod),
                accessor: 'end_period',
            },
            {
                Header: formatMessage(MESSAGES.created_by),
                id: 'created_by__username',
                accessor: 'created_by',
                Cell: UserCell,
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                id: 'created_at',
                accessor: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_by),
                id: 'updated_by__username',
                accessor: 'updated_by',
                Cell: UserCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_at),
                id: 'updated_at',
                accessor: 'updated_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                sortable: false,
                Cell: settings => {
                    return (
                        <section>
                            {settings.row.original.xls_file && (
                                <IconButton
                                    url={settings.row.original.xls_file}
                                    download
                                    icon="xls"
                                    tooltipMessage={MESSAGES.xls_form_file}
                                    reloadDocument
                                />
                            )}
                            <FormVersionsDialog
                                renderTrigger={({ openDialog }) => (
                                    <IconButton
                                        onClick={openDialog}
                                        icon="edit"
                                        tooltipMessage={MESSAGES.edit}
                                    />
                                )}
                                // onConfirmed={() => setForceRefresh(true)}
                                formVersion={settings.row.original}
                                periodType={periodType}
                                formId={formId}
                                titleMessage={{
                                    ...MESSAGES.updateFormVersion,
                                    values: {
                                        version_id:
                                            settings.row.original.version_id,
                                    },
                                }}
                                key={settings.row.original.updated_at}
                            />
                        </section>
                    );
                },
            },
        ],
        [formId, formatMessage, periodType],
    );
};

const getActionsColWidth = user => {
    const baseWidth = 50;
    let width = baseWidth * 2;
    if (
        userHasOneOfPermissions(
            [Permission.SUBMISSIONS, Permission.SUBMISSIONS_UPDATE],
            user,
        )
    ) {
        width += baseWidth;
    }
    if (userHasPermission(Permission.FORMS, user)) {
        width += baseWidth * 3;
    }
    return width;
};

export const useFormsTableColumns = ({
    orgUnitId,
    showDeleted,
    showInstancesCount,
}) => {
    const user = useCurrentUser();
    const hasDhis2Module = userHasAccessToModule('DHIS2_MAPPING', user);

    const { formatMessage } = useSafeIntl();

    return useMemo(() => {
        const cols = [
            {
                Header: formatMessage(MESSAGES.projects),
                accessor: 'projects',
                Cell: settings => <ProjectChips projects={settings.value} />,
            },
            {
                Header: formatMessage(MESSAGES.name),
                accessor: 'name',
                align: 'left',
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                accessor: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_at),
                accessor: 'updated_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.instance_updated_at),
                accessor: 'instance_updated_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.type),
                sortable: false,
                accessor: 'org_unit_types',
                Cell: settings =>
                    settings.row.original.org_unit_types
                        .map(o => o.short_name)
                        .join(', '),
            },
            {
                Header: formatMessage(MESSAGES.actions),
                resizable: false,
                sortable: false,
                width: getActionsColWidth(user),
                accessor: 'actions',
                Cell: settings => {
                    return (
                        <FormActions
                            settings={settings}
                            orgUnitId={orgUnitId}
                            baseUrls={baseUrls}
                            showDeleted={showDeleted}
                            hasDhis2Module={hasDhis2Module}
                        />
                    );
                },
            },
        ];
        if (showInstancesCount) {
            cols.splice(6, 0, {
                Header: formatMessage(MESSAGES.records),
                accessor: 'instances_count',
            });
        }
        if (showDeleted) {
            cols.splice(1, 0, {
                Header: formatMessage(MESSAGES.deleted_at),
                accessor: 'deleted_at',
                Cell: DateTimeCell,
            });
        }
        return cols;
    }, [
        formatMessage,
        hasDhis2Module,
        orgUnitId,
        showDeleted,
        user,
        showInstancesCount,
    ]);
};

export const requiredFields = [
    {
        type: 'string',
        key: 'name',
    },
    {
        type: 'array',
        key: 'project_ids',
    },
    {
        type: 'string',
        key: 'periods_before_allowed',
    },
    {
        type: 'string',
        key: 'periods_after_allowed',
    },
    {
        type: 'boolean',
        key: 'single_per_period',
    },
];
