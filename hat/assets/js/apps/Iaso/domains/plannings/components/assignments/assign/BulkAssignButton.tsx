import React, { FC, useCallback, useMemo, useState } from 'react';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { IconButton, Tooltip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import MESSAGES from '../../../messages';
import { getAssigneeRef } from '../api/utils';
import { BulkAssignDialog } from './BulkAssignDialog';
import { useAssignableOrgUnits } from './useAssignableOrgUnits';

export const BulkAssignButton: FC = () => {
    const { formatMessage } = useSafeIntl();
    const { currentAssignee } = useAssignmentsContext();
    const { assignableOrgUnitIds } = useAssignableOrgUnits();
    const [isOpen, setIsOpen] = useState(false);
    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const assigneeRef = useMemo(
        () => currentAssignee && getAssigneeRef(currentAssignee),
        [currentAssignee],
    );

    const tooltip = currentAssignee
        ? formatMessage(MESSAGES.bulkAssignTooltip, {
              member: currentAssignee.name,
          })
        : formatMessage(MESSAGES.mapHintNoMember);
    return (
        <>
            <Tooltip title={tooltip}>
                <span>
                    <IconButton
                        size="small"
                        disabled={
                            !currentAssignee || !assignableOrgUnitIds.size
                        }
                        onClick={open}
                        aria-label={tooltip}
                    >
                        <DoneAllIcon fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>
            {isOpen && currentAssignee && assigneeRef && (
                <BulkAssignDialog
                    assignee={currentAssignee}
                    assigneeRef={assigneeRef}
                    onClose={close}
                />
            )}
        </>
    );
};
