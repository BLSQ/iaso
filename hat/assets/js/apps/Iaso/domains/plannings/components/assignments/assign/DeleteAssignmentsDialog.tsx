import React, { FC } from 'react';
import { Typography } from '@mui/material';
import { ConfirmCancelModal } from 'bluesquare-components';
import MESSAGES from '../../../messages';

type Props = {
    open: boolean;
    title: string;
    text: string;
    onConfirm: () => void;
    onClose: () => void;
};

export const DeleteAssignmentsDialog: FC<Props> = ({
    open,
    title,
    text,
    onConfirm,
    onClose,
}) => (
    <ConfirmCancelModal
        open={open}
        id="delete-assignments"
        dataTestId="delete-assignments"
        titleMessage={title}
        onClose={onClose}
        closeDialog={onClose}
        onCancel={onClose}
        onConfirm={onConfirm}
        cancelMessage={MESSAGES.cancel}
        confirmMessage={MESSAGES.delete}
    >
        <Typography>{text}</Typography>
    </ConfirmCancelModal>
);
