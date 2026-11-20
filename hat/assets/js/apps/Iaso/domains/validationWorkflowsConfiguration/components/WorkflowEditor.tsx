import React, { FC, useCallback, useMemo } from 'react';
import { Box, Button } from '@mui/material';
import { useRedirectToReplace, useSafeIntl } from 'bluesquare-components';
import {
    useApiValidationWorkflowsCreate,
    useApiValidationWorkflowsUpdate,
    ValidationWorkflowRetrieve,
} from 'Iaso/api/validationWorkflows';
import { baseUrls } from 'Iaso/constants/urls';
import { userHasOneOfPermissions } from 'Iaso/domains/users/utils';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { SxStyles } from 'Iaso/types/general';
import { VALIDATION_WORKFLOWS } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { useSaveSteps } from '../api/PostPutPatch';
import {
    getStepErrors,
    NodeTemplate,
    useStepsEditor,
} from '../hooks/useStepsEditor';
import { useWorkflowDetailsForm } from '../hooks/useWorkflowDetailsForm';
import MESSAGES from '../messages';
import { StepsEditor } from './StepsEditor/StepsEditor';
import { WorkflowDetails } from './WorkflowDetails';

const styles = {
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 2,
        px: 2,
        py: 1.5,
    },
} satisfies SxStyles;

const NO_NODES: NodeTemplate[] = [];

type Props = {
    workflow?: ValidationWorkflowRetrieve;
    isLoading: boolean;
};

export const WorkflowEditor: FC<Props> = ({ workflow, isLoading }) => {
    const { formatMessage } = useSafeIntl();
    const params = useParamsObject(
        baseUrls.validationWorkflowsConfigurationDetail,
    );
    const redirectToReplace = useRedirectToReplace();
    const workflowSlug = workflow?.slug ?? '';
    const currentUser = useCurrentUser();
    // Without the permission the page is read only: no field, step or save action
    const canEdit = userHasOneOfPermissions(
        [VALIDATION_WORKFLOWS],
        currentUser,
    );

    const detailsForm = useWorkflowDetailsForm(workflow);
    const stepsEditor = useStepsEditor(workflow?.node_templates ?? NO_NODES);

    const { mutateAsync: createWorkflow, isLoading: isCreating } =
        useApiValidationWorkflowsCreate();
    const { mutateAsync: updateWorkflow, isLoading: isUpdating } =
        useApiValidationWorkflowsUpdate();
    const { mutateAsync: saveSteps, isLoading: isSavingSteps } =
        useSaveSteps(workflowSlug);
    const isSaving = isCreating || isUpdating || isSavingSteps;

    const nameError = detailsForm.details.name.trim()
        ? undefined
        : formatMessage(MESSAGES.requiredField);
    const stepErrors = useMemo(
        () =>
            getStepErrors(stepsEditor.steps, {
                required: formatMessage(MESSAGES.requiredField),
                duplicate: formatMessage(MESSAGES.duplicateStepName),
            }),
        [stepsEditor.steps, formatMessage],
    );
    const hasErrors =
        Boolean(nameError) || Object.values(stepErrors).some(Boolean);
    const isDirty = detailsForm.isDirty || stepsEditor.isDirty;

    const { reset: resetDetails } = detailsForm;
    const { reset: resetSteps } = stepsEditor;
    const handleCancel = useCallback(() => {
        resetDetails();
        resetSteps();
    }, [resetDetails, resetSteps]);

    const handleSave = useCallback(async () => {
        const { name, description, formIds } = detailsForm.details;
        const data = { name: name.trim(), description, forms: formIds };
        if (!workflow) {
            const created = await createWorkflow({ data });
            redirectToReplace(baseUrls.validationWorkflowsConfigurationDetail, {
                ...params,
                slug: created.slug,
            });
            return;
        }
        const requests: Promise<unknown>[] = [];
        if (detailsForm.isDirty) {
            requests.push(updateWorkflow({ slug: workflow.slug, data }));
        }
        if (stepsEditor.isDirty) {
            const { isOrderChanged, steps, changedSteps } = stepsEditor;
            requests.push(
                saveSteps({
                    reorder: isOrderChanged,
                    steps: (isOrderChanged ? steps : changedSteps).map(
                        step => ({
                            slug: step.slug,
                            name: step.name.trim(),
                            description: step.description,
                            can_skip_previous_nodes: step.canSkipPreviousNodes,
                            roles_required: step.roleIds,
                        }),
                    ),
                }),
            );
        }
        await Promise.all(requests);
    }, [
        createWorkflow,
        detailsForm.details,
        detailsForm.isDirty,
        params,
        redirectToReplace,
        saveSteps,
        stepsEditor,
        updateWorkflow,
        workflow,
    ]);

    return (
        <>
            <WorkflowDetails
                workflow={workflow}
                details={detailsForm.details}
                nameError={nameError}
                isLoading={isLoading}
                readOnly={!canEdit}
                onChange={detailsForm.updateDetails}
            />
            <StepsEditor
                workflow={workflow}
                isLoading={isLoading || isSaving}
                editor={stepsEditor}
                errors={stepErrors}
                hasUnsavedChanges={isDirty}
                readOnly={!canEdit}
                footer={
                    canEdit && (
                        <Box sx={styles.footer}>
                            <Button
                                onClick={handleCancel}
                                disabled={!isDirty || isSaving}
                                data-test="cancel-workflow"
                            >
                                {formatMessage(MESSAGES.cancel)}
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                disabled={!isDirty || hasErrors || isSaving}
                                data-test="save-workflow"
                            >
                                {formatMessage(MESSAGES.save)}
                            </Button>
                        </Box>
                    )
                }
            />
        </>
    );
};
