import React, { FC, useCallback, useMemo } from 'react';
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Box, Button, Divider, Grid, Paper, Typography } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { ValidationWorkflowRetrieve } from 'Iaso/api/validationWorkflows';
import { useGetUserRolesDropDown } from 'Iaso/domains/userRoles/hooks/requests/useGetUserRoles';
import { SxStyles } from 'Iaso/types/general';
import { useDeleteNode } from '../../api/Delete';
import { useSaveSteps } from '../../api/PostPutPatch';
import {
    getStepErrors,
    NodeTemplate,
    useStepsEditor,
} from '../../hooks/useStepsEditor';
import MESSAGES from '../../messages';
import { AddNode } from '../CreateEditNode/CreateEditNode';
import { StepRow } from './StepRow';
import { StepsPreview } from './StepsPreview';

const styles = {
    paper: {
        position: 'relative',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        minHeight: 40,
    },
    body: {
        p: 2,
        pb: 0.5,
    },
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

export const StepsEditor: FC<Props> = ({ workflow, isLoading }) => {
    const { formatMessage } = useSafeIntl();
    const workflowSlug = workflow?.slug ?? '';
    const isLocked = Boolean(workflow?.has_processes);
    const nodes = workflow?.node_templates ?? NO_NODES;

    const {
        steps,
        changedSteps,
        isOrderChanged,
        isDirty,
        updateStep,
        moveStep,
        reset,
    } = useStepsEditor(nodes);
    const { data: roleOptions, isFetching: isLoadingRoles } =
        useGetUserRolesDropDown();
    const { mutateAsync: saveSteps, isLoading: isSaving } =
        useSaveSteps(workflowSlug);
    const { mutate: deleteNode } = useDeleteNode(workflowSlug);

    const errors = useMemo(
        () =>
            getStepErrors(steps, {
                required: formatMessage(MESSAGES.requiredField),
                duplicate: formatMessage(MESSAGES.duplicateStepName),
            }),
        [steps, formatMessage],
    );
    const hasErrors = Object.values(errors).some(Boolean);

    const getRoleNames = useCallback(
        (roleIds: number[]) => {
            const names = new Map<number, string>();
            nodes.forEach(node =>
                node.roles_required?.forEach(role =>
                    names.set(role.id, role.name),
                ),
            );
            roleOptions?.forEach(option =>
                names.set(option.value, option.label),
            );
            return roleIds
                .map(id => names.get(id))
                .filter(Boolean)
                .join(', ');
        },
        [nodes, roleOptions],
    );

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );
    const handleDragEnd = useCallback(
        ({ active, over }: DragEndEvent) => {
            if (over && active.id !== over.id) {
                moveStep(String(active.id), String(over.id));
            }
        },
        [moveStep],
    );

    const handleDelete = useCallback(
        (nodeSlug: string) => deleteNode({ workflowSlug, nodeSlug }),
        [deleteNode, workflowSlug],
    );

    const handleSave = useCallback(() => {
        const toSave = isOrderChanged ? steps : changedSteps;
        return saveSteps({
            reorder: isOrderChanged,
            steps: toSave.map(step => ({
                slug: step.slug,
                name: step.name.trim(),
                description: step.description,
                can_skip_previous_nodes: step.canSkipPreviousNodes,
                roles_required: step.roleIds,
            })),
        });
    }, [changedSteps, isOrderChanged, saveSteps, steps]);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
                <Paper elevation={1} sx={styles.paper}>
                    {(isLoading || isSaving) && <LoadingSpinner absolute />}
                    <Box sx={styles.header}>
                        <Typography variant="h6">
                            {formatMessage(MESSAGES.validationSteps)}
                        </Typography>
                        {!isLocked && (
                            <AddNode
                                workflowSlug={workflowSlug}
                                iconProps={{
                                    message: MESSAGES.addStep,
                                    variant: 'outlined',
                                    disabled: !workflowSlug || isDirty,
                                    dataTestId: 'add-step-button',
                                }}
                            />
                        )}
                    </Box>
                    <Divider />
                    <Box sx={styles.body}>
                        {steps.length === 0 && !isLoading && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ pb: 1.5 }}
                            >
                                {formatMessage(MESSAGES.noSteps)}
                            </Typography>
                        )}
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            modifiers={[restrictToVerticalAxis]}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={steps.map(step => step.slug)}
                                strategy={verticalListSortingStrategy}
                            >
                                {steps.map((step, index) => (
                                    <StepRow
                                        key={step.slug}
                                        step={step}
                                        index={index}
                                        roleOptions={roleOptions ?? []}
                                        isLoadingRoles={isLoadingRoles}
                                        error={errors[step.slug]}
                                        isLocked={isLocked}
                                        isDeleteDisabled={isDirty}
                                        onChange={updateStep}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </Box>
                    <Divider />
                    <Box sx={styles.footer}>
                        <Button
                            onClick={reset}
                            disabled={!isDirty || isSaving}
                            data-test="cancel-steps"
                        >
                            {formatMessage(MESSAGES.cancel)}
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={!isDirty || hasErrors || isSaving}
                            data-test="save-steps"
                        >
                            {formatMessage(MESSAGES.save)}
                        </Button>
                    </Box>
                </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
                <StepsPreview steps={steps} getRoleNames={getRoleNames} />
            </Grid>
        </Grid>
    );
};
