import React, { useCallback, useMemo } from 'react';
import { Column, Setting, useSafeIntl } from 'bluesquare-components';
import {
    useApiValidationWorkflowsDestroy,
    ValidationWorkflowList,
    ValidationWorkflowRetrieve,
} from 'Iaso/api/validationWorkflows';
import { BreakWordCell } from 'Iaso/components/Cells/BreakWordCell';
import { DeleteModal } from 'Iaso/components/DeleteRestoreModals/DeleteModal';
import { useDeleteTableRow } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { userHasOneOfPermissions } from 'Iaso/domains/users/utils';
import { useDeleteNode } from 'Iaso/domains/validationWorkflowsConfiguration/api/Delete';
import { EditNode } from 'Iaso/domains/validationWorkflowsConfiguration/components/CreateEditNode/CreateEditNode';
import { VALIDATION_WORKFLOWS } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { WorkflowActions } from './components/WorkflowActions';
import {
    WorkflowLastUpdatedCell,
    WorkflowNameCell,
    WorkflowStepsCell,
} from './components/WorkflowListCells';
import MESSAGES from './messages';

type WorkflowRow = Setting<ValidationWorkflowList>;

type WorkflowsTableColumnsArgs = {
    // Url params with the defaults applied: used to go back one page when the last row of a page is deleted
    params: Record<string, any>;
    count: number;
};

export const useWorkflowsTableColumns = ({
    params,
    count,
}: WorkflowsTableColumnsArgs): Column[] => {
    const { formatMessage } = useSafeIntl();
    const user = useCurrentUser();
    // A boolean rather than the user object, so the columns are not rebuilt when the user is refetched
    const canEdit = userHasOneOfPermissions([VALIDATION_WORKFLOWS], user);
    const onDeleteSuccess = useDeleteTableRow({
        params,
        count,
        baseUrl: baseUrls.validationWorkflowsConfiguration,
    });
    const { mutate: deleteWorkflow } = useApiValidationWorkflowsDestroy({
        mutation: {
            onSuccess: onDeleteSuccess,
            // Without it, the default "Saved successfully" message is shown
            meta: { snackSuccessMessage: MESSAGES.deleteSuccess },
        },
    });
    const handleDelete = useCallback(
        (slug: string) => deleteWorkflow({ slug }),
        [deleteWorkflow],
    );

    return useMemo(() => {
        const cols: Column[] = [
            {
                Header: formatMessage(MESSAGES.workflow),
                id: 'name',
                accessor: 'name',
                align: 'left',
                sortable: true,
                Cell: ({ row }: WorkflowRow) => (
                    <WorkflowNameCell workflow={row.original} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.stepsColumn),
                id: 'steps',
                accessor: 'steps',
                align: 'left',
                sortable: false,
                Cell: ({ row }: WorkflowRow) => (
                    <WorkflowStepsCell workflow={row.original} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.lastUpdated),
                id: 'updated_at',
                accessor: 'updated_at',
                align: 'left',
                sortable: true,
                Cell: ({ row }: WorkflowRow) => (
                    <WorkflowLastUpdatedCell workflow={row.original} />
                ),
            },
        ];
        if (canEdit) {
            cols.push({
                Header: formatMessage(MESSAGES.actions),
                id: 'actions',
                accessor: 'actions',
                align: 'center',
                sortable: false,
                Cell: ({ row }: WorkflowRow) => (
                    <WorkflowActions
                        workflow={row.original}
                        onDelete={handleDelete}
                    />
                ),
            });
        }
        return cols;
    }, [formatMessage, canEdit, handleDelete]);
};

export const useWorkflowNodesColumns = (
    workFlowSlug?: string,
    hasProcesses?: boolean,
) => {
    const { formatMessage } = useSafeIntl();
    const user = useCurrentUser();

    const { mutate: deleteNode } = useDeleteNode(workFlowSlug);
    return useMemo(() => {
        const cols = [
            { Header: 'Order', id: 'order', accessor: 'order' },
            {
                Header: formatMessage(MESSAGES.name),
                id: 'name',
                accessor: 'name',
            },
            {
                Header: formatMessage(MESSAGES.description),
                id: 'description',
                accessor: 'description',
                Cell: BreakWordCell,
            },
            {
                Header: formatMessage(MESSAGES.rolesRequired),
                id: 'rolesRequired',
                accessor: 'roles_required',
                Cell: ({
                    value,
                }: {
                    value: NonNullable<
                        ValidationWorkflowRetrieve['node_templates']
                    >[number]['roles_required'];
                }) => {
                    return (
                        <BreakWordCell
                            value={value?.map(role => role.name).join(', ')}
                        />
                    );
                },
            },
        ];
        if (userHasOneOfPermissions([VALIDATION_WORKFLOWS], user)) {
            cols.push({
                Header: formatMessage(MESSAGES.actions),
                id: 'slug',
                accessor: 'slug',
                Cell: ({ value }: { value?: string }) => {
                    return (
                        <>
                            <EditNode
                                workflowSlug={workFlowSlug as string}
                                nodeSlug={value}
                                iconProps={{}}
                            />
                            {!hasProcesses && (
                                <DeleteModal
                                    key={`${workFlowSlug}${value}`}
                                    type="icon"
                                    titleMessage={MESSAGES.deleteNodeQuestion}
                                    onConfirm={() =>
                                        deleteNode({
                                            workflowSlug: workFlowSlug,
                                            nodeSlug: value,
                                        })
                                    }
                                    backdropClick
                                />
                            )}
                        </>
                    );
                },
            });
        }
        return cols;
    }, [deleteNode, formatMessage, user, workFlowSlug, hasProcesses]);
};
