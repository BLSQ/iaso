import { useMemo } from 'react';
import React from 'react';
import { IconButton, Setting, useSafeIntl } from 'bluesquare-components';
import { DateCell } from 'Iaso/components/Cells/DateTimeCell';
import { NumberCell } from 'Iaso/components/Cells/NumberCell';
import { DeleteModal } from 'Iaso/components/DeleteRestoreModals/DeleteModal';
import { baseUrls } from 'Iaso/constants/urls';
import { userHasOneOfPermissions } from 'Iaso/domains/users/utils';
import { SUBMISSIONS, SUBMISSIONS_UPDATE } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import MESSAGES from '../messages';
import { useDeleteWorkflow } from './api/useDeleteWorkflow';

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
                cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                id: 'formCount',
                accessor: 'formCount',
                cell: NumberCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_at),
                id: 'updatedAt',
                accessor: 'updatedAt',
                sortable: true,
                cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.created_by),
                id: 'createdBy',
                accessor: 'createdBy',
                sortable: true,
                cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_by),
                id: 'updatedBy',
                accessor: 'updatedBy',
                sortable: true,
                cell: DateCell,
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
                                tooltipMessage={MESSAGES.edit}
                                icon="edit"
                                // TODO use details url
                                url={`/${baseUrls.instanceValidationDetail}/slug/${settings.row.original.slug}`}
                            />
                            <DeleteModal
                                titleMessage={MESSAGES.deleteWorkflow}
                                onConfirm={() =>
                                    deleteWorkflow(settings.row.original.id)
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
