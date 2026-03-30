import { useMemo } from 'react';
import React from 'react';
import {
    IconButton,
    Setting,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';
import { BreakWordCell } from 'Iaso/components/Cells/BreakWordCell';
import { DateCell } from 'Iaso/components/Cells/DateTimeCell';
import { NumberCell } from 'Iaso/components/Cells/NumberCell';
import { ColorBadge } from 'Iaso/components/ColorBadge';
import { DeleteModal } from 'Iaso/components/DeleteRestoreModals/DeleteModal';
import { baseUrls } from 'Iaso/constants/urls';
import { userHasOneOfPermissions } from 'Iaso/domains/users/utils';
import { VALIDATION_WORKFLOWS } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import MESSAGES from '../messages';
import { useDeleteNode, useDeleteWorkflow } from './api/Delete';
import { EditNode } from './details/CreateEditNode/CreateEditNode';

export const useWorkflowsTableColumns = () => {
    const { formatMessage } = useSafeIntl();
    const user = useCurrentUser();
    const { mutateAsync: deleteWorkflow } = useDeleteWorkflow();

    return useMemo(() => {
        const cols = [
            {
                Header: formatMessage(MESSAGES.name),
                id: 'name',
                accessor: 'name',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                id: 'createdAt',
                accessor: 'created_at',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.forms),
                id: 'formCount',
                accessor: 'form_count',
                Cell: NumberCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_at),
                id: 'updatedAt',
                accessor: 'updated_at',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.created_by),
                id: 'createdBy',
                accessor: 'created_by',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.updated_by),
                id: 'updatedBy',
                accessor: 'updated_by',
                sortable: true,
                Cell: ({ value }) => value ?? textPlaceholder,
            },
        ];
        if (userHasOneOfPermissions([VALIDATION_WORKFLOWS], user)) {
            cols.push({
                Header: formatMessage(MESSAGES.actions),
                id: 'actions',
                accessor: 'actions',
                sortable: false,
                Cell: (settings: Setting<any>) => {
                    return (
                        <>
                            <IconButton
                                tooltipMessage={MESSAGES.edit}
                                icon="edit"
                                url={`/${baseUrls.instanceValidationDetail}/slug/${settings.row.original.slug}`}
                            />
                            <DeleteModal
                                key={settings.row.original.slug}
                                type="icon"
                                titleMessage={MESSAGES.deleteWorkflow}
                                onConfirm={() =>
                                    deleteWorkflow(settings.row.original.slug)
                                }
                                backdropClick
                            />
                        </>
                    );
                },
            });
        }
        return cols;
    }, [formatMessage, user, deleteWorkflow]);
};

export const useWorkflowNodesColumns = (workFlowSlug?: string) => {
    const { formatMessage } = useSafeIntl();
    const user = useCurrentUser();
    const { mutate: deleteNode } = useDeleteNode();
    return useMemo(() => {
        const cols = [
            { Header: 'Order', id: 'order', accessor: 'order' },
            {
                Header: formatMessage(MESSAGES.color),
                id: 'color',
                accessor: 'color',
                Cell: value => {
                    return (
                        <ColorBadge
                            data-testid={'node-color'}
                            backgroundColor={value.value}
                        />
                    );
                },
            },
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
                Cell: value => {
                    return (
                        <BreakWordCell
                            value={value?.value
                                ?.map(role => role.name)
                                .join(', ')}
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
                Cell: ({ value }: { value: string }) => {
                    return (
                        <>
                            <EditNode
                                workflowSlug={workFlowSlug as string}
                                nodeSlug={value}
                                iconProps={{}}
                            />
                            <DeleteModal
                                key={`${workFlowSlug}${value}`}
                                type="icon"
                                titleMessage={MESSAGES.deleteNodeQuestion}
                                onConfirm={() =>
                                    deleteNode({
                                        workFlowSlug,
                                        nodeSlug: value,
                                    })
                                }
                                backdropClick
                            />
                        </>
                    );
                },
            });
        }
        return cols;
    }, [deleteNode, formatMessage, user, workFlowSlug]);
};
