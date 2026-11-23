import React, { FunctionComponent, useMemo, useState } from 'react';
import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import FileCopy from '@mui/icons-material/FileCopy';
import { ActionsCell, TableAction, useRedirectTo } from 'bluesquare-components';
import {
    useApiValidationWorkflowsDuplicateCreate,
    ValidationWorkflowList,
} from 'Iaso/api/validationWorkflows';
import DeleteDialog from 'Iaso/components/dialogs/DeleteDialogComponent';
import { baseUrls } from 'Iaso/constants/urls';
import MESSAGES from '../messages';

type Props = {
    workflow: ValidationWorkflowList;
    onDelete: () => void;
};

// Same row actions as the forms list: edit inline, the rest in the ⋮ menu
export const WorkflowActions: FunctionComponent<Props> = ({
    workflow,
    onDelete,
}) => {
    // Bumped to open a fresh delete dialog from the menu
    const [deleteDialogKey, setDeleteDialogKey] = useState(0);
    const redirectTo = useRedirectTo();
    const { mutate: duplicateWorkflow, isLoading: isDuplicating } =
        useApiValidationWorkflowsDuplicateCreate({
            mutation: {
                // Open the copy so it can be edited and linked to forms
                onSuccess: ({ slug }) =>
                    redirectTo(
                        baseUrls.validationWorkflowsConfigurationDetail,
                        {
                            slug,
                        },
                    ),
            },
        });

    const actions: TableAction[] = useMemo(
        () => [
            {
                key: 'edit',
                label: MESSAGES.edit,
                icon: <Edit />,
                href: `/${baseUrls.validationWorkflowsConfigurationDetail}/slug/${workflow.slug}`,
            },
            {
                key: 'duplicate',
                label: MESSAGES.duplicate,
                icon: <FileCopy />,
                menu: true,
                disabled: isDuplicating,
                onClick: () => duplicateWorkflow({ slug: workflow.slug }),
            },
            { type: 'divider' },
            {
                key: 'delete',
                label: MESSAGES.delete,
                icon: <Delete />,
                menu: true,
                color: 'error.main',
                onClick: () => setDeleteDialogKey(key => key + 1),
            },
        ],
        [workflow.slug, duplicateWorkflow, isDuplicating],
    );

    return (
        <>
            <ActionsCell actions={actions} maxInline={1} />
            {deleteDialogKey > 0 && (
                <DeleteDialog
                    key={deleteDialogKey}
                    defaultOpen
                    titleMessage={MESSAGES.deleteWorkflow}
                    onConfirm={onDelete}
                    Trigger={() => <></>}
                />
            )}
        </>
    );
};
