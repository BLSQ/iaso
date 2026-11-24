import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
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
    onDelete: (slug: string) => void;
};

// The dialog is opened from the menu: it has no trigger of its own.
// Defined once, an inline component would be a new type (so remounted) on each render
const NoTrigger = () => null;

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
                onSuccess: copy =>
                    redirectTo(
                        baseUrls.validationWorkflowsConfigurationDetail,
                        { slug: copy.slug },
                    ),
            },
        });

    const { slug } = workflow;
    const handleDelete = useCallback(() => onDelete(slug), [onDelete, slug]);
    const openDeleteDialog = useCallback(
        () => setDeleteDialogKey(key => key + 1),
        [],
    );

    const actions: TableAction[] = useMemo(
        () => [
            {
                key: 'edit',
                label: MESSAGES.edit,
                icon: <Edit />,
                href: `/${baseUrls.validationWorkflowsConfigurationDetail}/slug/${slug}`,
            },
            {
                key: 'duplicate',
                label: MESSAGES.duplicate,
                icon: <FileCopy />,
                menu: true,
                disabled: isDuplicating,
                onClick: () => duplicateWorkflow({ slug }),
            },
            { type: 'divider' },
            {
                key: 'delete',
                label: MESSAGES.delete,
                icon: <Delete />,
                menu: true,
                color: 'error.main',
                onClick: openDeleteDialog,
            },
        ],
        [slug, duplicateWorkflow, isDuplicating, openDeleteDialog],
    );

    return (
        <>
            <ActionsCell actions={actions} maxInline={1} />
            {deleteDialogKey > 0 && (
                <DeleteDialog
                    key={deleteDialogKey}
                    defaultOpen
                    titleMessage={MESSAGES.deleteWorkflow}
                    onConfirm={handleDelete}
                    Trigger={NoTrigger}
                />
            )}
        </>
    );
};
