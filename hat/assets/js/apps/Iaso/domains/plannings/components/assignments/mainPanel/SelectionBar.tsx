import React, { FC, ReactElement, useCallback } from 'react';
import DeselectIcon from '@mui/icons-material/Deselect';
import LibraryAddCheckIcon from '@mui/icons-material/LibraryAddCheck';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import {
    Box,
    Button,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { ConfirmCancelModal, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import MESSAGES from '../../../messages';
import { ListSelection } from '../assign/useListSelection';
import { AssignmentProgressSummary } from './AssignmentProgressSummary';
import { AssignmentProgress } from './utils';

const styles = {
    bar: {
        alignItems: 'center',
        gap: 0.5,
        px: 4,
        py: 0.75,
        borderBottom: 1,
        borderColor: 'divider',
        minHeight: 48,
    },
    count: {
        mr: 1,
    },
    spacer: {
        flex: 1,
    },
} satisfies SxStyles;

type ActionProps = {
    tooltip: string;
    icon: ReactElement;
    disabled?: boolean;
    onClick: () => void;
};

const SelectionAction: FC<ActionProps> = ({
    tooltip,
    icon,
    disabled = false,
    onClick,
}) => (
    <Tooltip title={tooltip}>
        <span>
            <IconButton
                size="small"
                disabled={disabled}
                onClick={onClick}
                aria-label={tooltip}
            >
                {icon}
            </IconButton>
        </span>
    </Tooltip>
);

type Props = {
    selection: ListSelection;
    progress: AssignmentProgress;
};

export const SelectionBar: FC<Props> = ({ selection, progress }) => {
    const { formatMessage } = useSafeIntl();
    const { currentAssignee } = useAssignmentsContext();
    const {
        selectedIds,
        selectAll,
        selectUnassigned,
        unselectAll,
        assignSelected,
        unassignSelected,
        pendingChange,
        cancelPendingChange,
    } = selection;
    const hasSelection = selectedIds.size > 0;

    const confirmPendingChange = useCallback(() => {
        pendingChange?.apply();
        cancelPendingChange();
    }, [pendingChange, cancelPendingChange]);

    return (
        <Stack direction="row" sx={styles.bar}>
            <Typography variant="body2" sx={styles.count}>
                {hasSelection
                    ? formatMessage(MESSAGES.selectedOrgUnitsCount, {
                          count: `${selectedIds.size}`,
                      })
                    : formatMessage(MESSAGES.noOrgUnitSelected)}
            </Typography>
            <SelectionAction
                tooltip={formatMessage(MESSAGES.selectAll)}
                icon={<SelectAllIcon fontSize="small" />}
                onClick={selectAll}
            />
            <SelectionAction
                tooltip={formatMessage(MESSAGES.selectUnassigned)}
                icon={<LibraryAddCheckIcon fontSize="small" />}
                onClick={selectUnassigned}
            />
            <SelectionAction
                tooltip={formatMessage(MESSAGES.unselectAll)}
                icon={<DeselectIcon fontSize="small" />}
                disabled={!hasSelection}
                onClick={unselectAll}
            />
            <Box sx={styles.spacer} />
            {hasSelection && (
                <>
                    <SelectionAction
                        tooltip={formatMessage(MESSAGES.unassignSelected)}
                        icon={<PersonRemoveIcon fontSize="small" />}
                        onClick={unassignSelected}
                    />
                    <Tooltip
                        title={
                            currentAssignee
                                ? ''
                                : formatMessage(MESSAGES.mapHintPickMember)
                        }
                    >
                        <span>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<PersonAddIcon />}
                                disabled={!currentAssignee}
                                onClick={assignSelected}
                            >
                                {currentAssignee
                                    ? formatMessage(MESSAGES.bulkAssignTo, {
                                          member: currentAssignee.name,
                                      })
                                    : formatMessage(MESSAGES.assign)}
                            </Button>
                        </span>
                    </Tooltip>
                </>
            )}
            <AssignmentProgressSummary progress={progress} />
            <ConfirmCancelModal
                open={Boolean(pendingChange)}
                id="clear-selection-assignments-below"
                dataTestId="clear-selection-assignments-below"
                titleMessage={formatMessage(
                    MESSAGES.clearSelectionAssignmentsBelowTitle,
                )}
                onClose={cancelPendingChange}
                closeDialog={cancelPendingChange}
                onCancel={cancelPendingChange}
                onConfirm={confirmPendingChange}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.confirm}
            >
                <Typography>
                    {formatMessage(
                        MESSAGES.clearSelectionAssignmentsBelowText,
                        {
                            count: `${pendingChange?.clearedCount ?? 0}`,
                        },
                    )}
                </Typography>
            </ConfirmCancelModal>
        </Stack>
    );
};
