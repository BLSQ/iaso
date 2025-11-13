import React, { ChangeEvent, useMemo, useState, useCallback } from 'react';
import {
    Column,
    ColumnSelectorHiddenProps,
    IconButton,
    useSafeIntl,
} from 'bluesquare-components';
import { UserCell } from 'Iaso/components/Cells/UserCell';
import { ProjectChips } from 'Iaso/domains/projects/components/ProjectChips';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell';
import { baseUrls } from '../../../constants/urls';
import * as Permission from '../../../utils/permissions';
import { useCurrentUser, User } from '../../../utils/usersUtils';
import {
    userHasAccessToModule,
    userHasOneOfPermissions,
    userHasPermission,
} from '../../users/utils';
import { FormActions } from '../components/FormActions';
import FormVersionsDialog from '../components/FormVersionsDialogComponent';
import MESSAGES from '../messages';

export const baseUrl = baseUrls.forms;

type FormVersionsTableColumnsProps = {
    formId: string;
    periodType: string;
};

export const useFormVersionsTableColumns = ({
    formId,
    periodType,
}: FormVersionsTableColumnsProps): Column[] => {
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
                                onConfirmed={() => {}}
                                formVersion={settings.row.original}
                                periodType={periodType}
                                formId={parseInt(formId, 10)}
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

const getActionsColWidth = (user: User): number => {
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

type FormsTableColumnsProps = {
    orgUnitId: string;
    showDeleted: boolean;
};

const DEFAULT_VISIBLE_COLUMNS = [
    'projects',
    'name',
    'created_at',
    'updated_at',
    'instance_updated_at',
    'org_unit_types',
    'actions',
];

export const useFormsTableColumns = ({
    orgUnitId,
    showDeleted,
}: FormsTableColumnsProps): Column[] => {
    const [visibleColumns, setVisibleColumns] = useState<string[]>(
        DEFAULT_VISIBLE_COLUMNS,
    );
    const user = useCurrentUser();
    const hasDhis2Module = userHasAccessToModule('DHIS2_MAPPING', user);

    const { formatMessage } = useSafeIntl();
    const getToggleHiddenProps = useCallback(
        (columnId: string): ColumnSelectorHiddenProps => {
            return {
                checked: columnId ? visibleColumns.includes(columnId) : false,
                onChange: (_event: ChangeEvent<HTMLInputElement>) => {
                    if (!columnId) return;
                    setVisibleColumns(prev =>
                        prev.includes(columnId)
                            ? prev.filter(c => c !== columnId)
                            : [...prev, columnId],
                    );
                },
            };
        },
        [visibleColumns],
    );

    return useMemo(() => {
        const cols = [
            {
                Header: formatMessage(MESSAGES.projects),
                accessor: 'projects',
                Cell: settings => <ProjectChips projects={settings.value} />,
                getToggleHiddenProps: () => getToggleHiddenProps('projects'),
            },
            {
                Header: formatMessage(MESSAGES.name),
                accessor: 'name',
                align: 'left' as const,
                getToggleHiddenProps: () => getToggleHiddenProps('name'),
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                accessor: 'created_at',
                Cell: DateTimeCell,
                getToggleHiddenProps: () => getToggleHiddenProps('created_at'),
            },
            {
                Header: formatMessage(MESSAGES.updated_at),
                accessor: 'updated_at',
                Cell: DateTimeCell,
                getToggleHiddenProps: () => getToggleHiddenProps('updated_at'),
            },
            {
                Header: formatMessage(MESSAGES.instance_updated_at),
                accessor: 'instance_updated_at',
                Cell: DateTimeCell,
                getToggleHiddenProps: () =>
                    getToggleHiddenProps('instance_updated_at'),
            },
            {
                Header: formatMessage(MESSAGES.type),
                sortable: false,
                accessor: 'org_unit_types',
                Cell: settings =>
                    settings.row.original.org_unit_types
                        .map(o => o.short_name)
                        .join(', '),
                getToggleHiddenProps: () =>
                    getToggleHiddenProps('org_unit_types'),
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
                getToggleHiddenProps: () => getToggleHiddenProps('actions'),
            },
        ];
        if (showDeleted) {
            cols.splice(1, 0, {
                Header: formatMessage(MESSAGES.deleted_at),
                accessor: 'deleted_at',
                Cell: DateTimeCell,
                getToggleHiddenProps: () => getToggleHiddenProps('deleted_at'),
            });
        }
        return cols;
    }, [
        formatMessage,
        hasDhis2Module,
        orgUnitId,
        showDeleted,
        user,
        getToggleHiddenProps,
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
