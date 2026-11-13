import React, { FC, useCallback, useMemo, useState } from 'react';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { IconButton, Tooltip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import MESSAGES from '../../../messages';
import { DeleteAssignmentsDialog } from './DeleteAssignmentsDialog';
import { useAssignableOrgUnits } from './useAssignableOrgUnits';
import { useChangeAssignments } from './useChangeAssignments';
import { getAssignedOrgUnitIds } from './utils';

// Removes what the selected team's members were given, and the assignments made inside it.
export const EmptyAreaButton: FC = () => {
    const { formatMessage } = useSafeIntl();
    const { selectedTeam, selectedLevel } = useAssignmentsContext();
    const { assignments, assignableOrgUnitIds } = useAssignableOrgUnits();
    const changeAssignments = useChangeAssignments();
    const [isOpen, setIsOpen] = useState(false);

    const orgUnitIds = useMemo(
        () => getAssignedOrgUnitIds(assignments, assignableOrgUnitIds),
        [assignments, assignableOrgUnitIds],
    );
    const isRootTeam = selectedLevel === 0;
    const team = selectedTeam.name;

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const confirm = useCallback(() => {
        changeAssignments({ orgUnitIds });
        setIsOpen(false);
    }, [changeAssignments, orgUnitIds]);

    const tooltip = isRootTeam
        ? formatMessage(MESSAGES.deleteAllAssignments)
        : formatMessage(MESSAGES.deleteAreaAssignments, { team });
    return (
        <>
            <Tooltip title={tooltip}>
                <span>
                    <IconButton
                        size="small"
                        disabled={!orgUnitIds.length}
                        onClick={open}
                        aria-label={tooltip}
                    >
                        <DeleteSweepIcon fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>
            <DeleteAssignmentsDialog
                open={isOpen}
                title={tooltip}
                text={
                    isRootTeam
                        ? formatMessage(MESSAGES.deleteAllAssignmentsText, {
                              count: `${assignments.length}`,
                          })
                        : formatMessage(MESSAGES.deleteAreaAssignmentsText, {
                              count: `${orgUnitIds.length}`,
                              team,
                          })
                }
                onConfirm={confirm}
                onClose={close}
            />
        </>
    );
};
