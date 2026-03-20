import { useMemo } from 'react';
import React from 'react';
import { IconButton, Setting, useSafeIntl } from 'bluesquare-components';
import { BreakWordCell } from 'Iaso/components/Cells/BreakWordCell';
import { DateCell } from 'Iaso/components/Cells/DateTimeCell';
import { NumberCell } from 'Iaso/components/Cells/NumberCell';
import { ColorBadge } from 'Iaso/components/ColorBadge';
import { DeleteModal } from 'Iaso/components/DeleteRestoreModals/DeleteModal';
import { baseUrls } from 'Iaso/constants/urls';
import { userHasOneOfPermissions } from 'Iaso/domains/users/utils';
import { SUBMISSIONS, SUBMISSIONS_UPDATE } from 'Iaso/utils/permissions';
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
                accessor: 'createdAt',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                id: 'formCount',
                accessor: 'formCount',
                Cell: NumberCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_at),
                id: 'updatedAt',
                accessor: 'updatedAt',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.created_by),
                id: 'createdBy',
                accessor: 'createdBy',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_by),
                id: 'updatedBy',
                accessor: 'updatedBy',
                sortable: true,
                Cell: DateCell,
            },
        ];
        if (userHasOneOfPermissions([SUBMISSIONS_UPDATE, SUBMISSIONS], user)) {
            cols.push({
                Header: formatMessage(MESSAGES.actions),
                id: 'actions',
                accessor: 'actions',
                sortable: false,
                Cell: (settings: Setting<any>) => {
                    return (
                        <>
                            <IconButton
                                tooltipMessage={MESSAGES.see}
                                icon="remove-red-eye"
                                url={`/${baseUrls.instanceValidationDetail}/slug/${settings.row.original.slug}`}
                            />
                            <DeleteModal
                                titleMessage={MESSAGES.deleteWorkflow}
                                onConfirm={() =>
                                    deleteWorkflow(settings.row.original.slug)
                                }
                                type="icon"
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
                accessor: 'rolesRequired',
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
        if (userHasOneOfPermissions([SUBMISSIONS_UPDATE, SUBMISSIONS], user)) {
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
                                titleMessage={MESSAGES.deleteNodeQuestion}
                                onConfirm={() =>
                                    deleteNode({
                                        workFlowSlug,
                                        nodeSlug: value,
                                    })
                                }
                                type="icon"
                            />
                        </>
                    );
                },
            });
        }
        return cols;
    }, [deleteNode, formatMessage, user, workFlowSlug]);
};
