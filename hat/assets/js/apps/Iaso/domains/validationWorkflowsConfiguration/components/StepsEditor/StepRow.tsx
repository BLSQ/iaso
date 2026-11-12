import React, { FC } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { DeleteModal } from 'Iaso/components/DeleteRestoreModals/DeleteModal';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { SxStyles } from 'Iaso/types/general';
import { DropdownOptions } from 'Iaso/types/utils';
import { commaSeparatedIdsToArray } from 'Iaso/utils/forms';
import { StepDraft } from '../../hooks/useStepsEditor';
import MESSAGES from '../../messages';

const styles = {
    row: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        p: 2,
        mb: 1.5,
        border: theme => `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        backgroundColor: 'background.paper',
    },
    handle: {
        display: 'flex',
        alignItems: 'center',
        height: 40,
        color: 'text.disabled',
        cursor: 'grab',
        touchAction: 'none',
        '&:hover': { color: 'text.secondary' },
    },
    handleDisabled: {
        cursor: 'default',
        visibility: 'hidden',
    },
    order: {
        flexShrink: 0,
        width: 28,
        height: 28,
        mt: '6px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.8rem',
        color: 'text.secondary',
        backgroundColor: 'grey.100',
        border: theme => `1px solid ${theme.palette.divider}`,
    },
    fields: {
        flex: 1,
        minWidth: 0,
    },
    fieldsRow: {
        display: 'flex',
        gap: 2,
    },
    field: {
        flex: 1,
        minWidth: 0,
    },
    delete: {
        mt: '2px',
    },
} satisfies SxStyles;

type Props = {
    step: StepDraft;
    index: number;
    roleOptions: DropdownOptions<number>[];
    isLoadingRoles: boolean;
    error?: string;
    // The chain can't change once submissions went through it.
    isLocked: boolean;
    // Deleting refetches the steps, which would drop unsaved edits.
    isDeleteDisabled: boolean;
    onChange: (slug: string, changes: Partial<StepDraft>) => void;
    onDelete: (slug: string) => void;
};

export const StepRow: FC<Props> = ({
    step,
    index,
    roleOptions,
    isLoadingRoles,
    error,
    isLocked,
    isDeleteDisabled,
    onChange,
    onDelete,
}) => {
    const { formatMessage } = useSafeIntl();
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: step.slug, disabled: isLocked });

    return (
        <Box
            ref={setNodeRef}
            sx={styles.row}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                position: 'relative',
                zIndex: isDragging ? 1 : undefined,
                boxShadow: isDragging
                    ? '0 4px 12px rgba(0, 0, 0, 0.15)'
                    : undefined,
            }}
            data-test={`step-row-${step.slug}`}
        >
            <Box
                ref={setActivatorNodeRef}
                sx={
                    isLocked
                        ? { ...styles.handle, ...styles.handleDisabled }
                        : styles.handle
                }
                {...attributes}
                {...listeners}
            >
                <DragIndicatorIcon fontSize="small" />
            </Box>
            <Box sx={styles.order}>{index + 1}</Box>
            <Box sx={styles.fields}>
                <Box sx={styles.fieldsRow}>
                    <Box sx={styles.field}>
                        <InputComponent
                            keyValue={`name_${step.slug}`}
                            type="text"
                            withMarginTop={false}
                            labelString={formatMessage(MESSAGES.stepName)}
                            value={step.name}
                            onChange={(_keyValue, value) =>
                                onChange(step.slug, { name: value ?? '' })
                            }
                            errors={error ? [error] : []}
                            required
                        />
                    </Box>
                    <Box sx={styles.field}>
                        <InputComponent
                            keyValue={`roles_required_${step.slug}`}
                            type="select"
                            multi
                            clearable
                            withMarginTop={false}
                            value={step.roleIds}
                            options={roleOptions}
                            loading={isLoadingRoles}
                            labelString={formatMessage(
                                MESSAGES.validatedByUserRole,
                            )}
                            onChange={(_keyValue, value) =>
                                onChange(step.slug, {
                                    roleIds: commaSeparatedIdsToArray(value),
                                })
                            }
                        />
                    </Box>
                </Box>
                <InputComponent
                    keyValue={`can_skip_previous_nodes_${step.slug}`}
                    type="checkbox"
                    withMarginTop={false}
                    labelString={formatMessage(MESSAGES.canSkipPreviousNodes)}
                    value={Boolean(step.canSkipPreviousNodes)}
                    onChange={(_keyValue, value) =>
                        onChange(step.slug, {
                            canSkipPreviousNodes: Boolean(value),
                        })
                    }
                />
            </Box>
            {!isLocked && (
                <Box sx={styles.delete}>
                    <DeleteModal
                        type="icon"
                        titleMessage={MESSAGES.deleteNodeQuestion}
                        onConfirm={() => onDelete(step.slug)}
                        iconProps={{
                            color: 'error',
                            disabled: isDeleteDisabled,
                        }}
                        backdropClick
                    />
                </Box>
            )}
        </Box>
    );
};
