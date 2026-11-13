import React, { FC, useCallback } from 'react';
import { Typography } from '@mui/material';
import { ConfirmCancelModal, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../messages';
import { PendingAssignmentChange } from './useAssignOnClick';

type Props = {
    pendingChange?: PendingAssignmentChange;
    onClose: () => void;
};

export const ClearAssignmentsBelowDialog: FC<Props> = ({
    pendingChange,
    onClose,
}) => {
    const { formatMessage } = useSafeIntl();
    const handleConfirm = useCallback(() => {
        pendingChange?.apply();
        onClose();
    }, [pendingChange, onClose]);
    const name = pendingChange?.orgUnitName ?? '';
    return (
        <ConfirmCancelModal
            open={Boolean(pendingChange)}
            id="clear-assignments-below"
            dataTestId="clear-assignments-below"
            titleMessage={formatMessage(MESSAGES.clearAssignmentsBelowTitle, {
                name,
            })}
            onClose={onClose}
            closeDialog={onClose}
            onCancel={onClose}
            onConfirm={handleConfirm}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
        >
            <Typography>
                {formatMessage(
                    pendingChange?.isUnassign
                        ? MESSAGES.clearAssignmentsBelowOnUnassign
                        : MESSAGES.clearAssignmentsBelowOnReassign,
                    { name },
                )}
            </Typography>
        </ConfirmCancelModal>
    );
};
