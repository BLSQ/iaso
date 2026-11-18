import React, { FC, ReactNode, useCallback } from 'react';
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
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Box, Divider, Paper, Typography } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { ValidationWorkflowRetrieve } from 'Iaso/api/validationWorkflows';
import { useGetUserRolesDropDown } from 'Iaso/domains/userRoles/hooks/requests/useGetUserRoles';
import { SxStyles } from 'Iaso/types/general';
import { useDeleteNode } from '../../api/Delete';
import { StepErrors, StepsEditorState } from '../../hooks/useStepsEditor';
import MESSAGES from '../../messages';
import { AddNode } from '../CreateEditNode/CreateEditNode';
import { StepRow } from './StepRow';

const styles = {
    paper: {
        position: 'relative',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 2,
        py: 1.5,
        minHeight: 40,
    },
    orderHelp: {
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
    },
    body: {
        p: 2,
        pb: 0.5,
    },
    empty: {
        pb: 1.5,
    },
} satisfies SxStyles;

type Props = {
    workflow?: ValidationWorkflowRetrieve;
    isLoading: boolean;
    editor: StepsEditorState;
    errors: StepErrors;
    hasUnsavedChanges: boolean;
    footer: ReactNode;
};

export const StepsEditor: FC<Props> = ({
    workflow,
    isLoading,
    editor,
    errors,
    hasUnsavedChanges,
    footer,
}) => {
    const { formatMessage } = useSafeIntl();
    const workflowSlug = workflow?.slug ?? '';
    const isLocked = Boolean(workflow?.has_processes);
    const { steps, updateStep, moveStep } = editor;

    const { data: roleOptions, isFetching: isLoadingRoles } =
        useGetUserRolesDropDown();
    const { mutate: deleteNode } = useDeleteNode(workflowSlug);

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

    return (
        <Paper elevation={1} sx={styles.paper}>
            {isLoading && <LoadingSpinner absolute />}
            <Box sx={styles.header}>
                <Box>
                    <Typography variant="h6">
                        {formatMessage(MESSAGES.validationSteps)}
                    </Typography>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={styles.orderHelp}
                    >
                        <ArrowDownwardIcon fontSize="inherit" />
                        {formatMessage(MESSAGES.stepsOrderHelp)}
                    </Typography>
                </Box>
                {!isLocked && (
                    <AddNode
                        workflowSlug={workflowSlug}
                        isFirstStep={steps.length === 0}
                        iconProps={{
                            message: MESSAGES.addStep,
                            variant: 'outlined',
                            disabled: !workflowSlug || hasUnsavedChanges,
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
                        sx={styles.empty}
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
                                isDeleteDisabled={hasUnsavedChanges}
                                onChange={updateStep}
                                onDelete={handleDelete}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </Box>
            <Divider />
            {footer}
        </Paper>
    );
};
