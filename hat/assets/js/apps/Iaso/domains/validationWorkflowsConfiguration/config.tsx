import { useMemo } from 'react';
import React from 'react';
import {
    Column,
    IconButton,
    Setting,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';
import {
    PaginatedValidationWorkflowListList,
    useApiValidationWorkflowsDestroy,
} from 'Iaso/api/validationWorkflows';
import { DateCell } from 'Iaso/components/Cells/DateTimeCell';
import { NumberCell } from 'Iaso/components/Cells/NumberCell';
import { DeleteModal } from 'Iaso/components/DeleteRestoreModals/DeleteModal';
import { baseUrls } from 'Iaso/constants/urls';
import { userHasOneOfPermissions } from 'Iaso/domains/users/utils';
import { VALIDATION_WORKFLOWS } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import MESSAGES from './messages';

export const useWorkflowsTableColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    const user = useCurrentUser();
    const { mutateAsync: deleteWorkflow } = useApiValidationWorkflowsDestroy();

    return useMemo(() => {
        const cols: Column[] = [
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
                Cell: ({ value }) => <NumberCell value={value} />,
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
                Cell: ({ value }: { value?: string }) =>
                    value ?? textPlaceholder,
            },
        ];
        if (userHasOneOfPermissions([VALIDATION_WORKFLOWS], user)) {
            cols.push({
                Header: formatMessage(MESSAGES.actions),
                id: 'actions',
                accessor: 'actions',
                sortable: false,
                Cell: (
                    settings: Setting<
                        NonNullable<
                            PaginatedValidationWorkflowListList['results']
                        >[number]
                    >,
                ) => {
                    return (
                        <>
                            <IconButton
                                tooltipMessage={MESSAGES.edit}
                                icon="edit"
                                url={`/${baseUrls.validationWorkflowsConfigurationDetail}/slug/${settings.row.original.slug}`}
                            />
                            <DeleteModal
                                key={settings.row.original.slug}
                                type="icon"
                                titleMessage={MESSAGES.deleteWorkflow}
                                onConfirm={() =>
                                    deleteWorkflow({
                                        slug: settings.row.original.slug,
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
    }, [formatMessage, user, deleteWorkflow]);
};
