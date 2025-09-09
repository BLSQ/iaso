import { ConfirmCancelModal } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { Box, Divider, Typography } from '@mui/material';
import { MESSAGES } from './messages';
import { noOp } from '../../../../utils';

type Props = {
    open: boolean;
    closeDialog: () => void;
    onConfirm: () => void;
    titleMessage?: string;
    bodyMessage?: string;
};

export const WarningModal: FunctionComponent<Props> = ({
    open,
    closeDialog,
    onConfirm,
    titleMessage = '',
    bodyMessage = '',
}) => {
    return (
        <ConfirmCancelModal
            open={open}
            id="user-WarningModal"
            dataTestId="user-WarningModal"
            titleMessage={titleMessage}
            onClose={noOp}
            closeDialog={closeDialog}
            onConfirm={onConfirm}
            onCancel={noOp}
            confirmMessage={MESSAGES.confirm}
            cancelMessage={MESSAGES.cancel}
        >
            <Divider />
            <Box mt={2}>
                <Typography>{bodyMessage}</Typography>
            </Box>
        </ConfirmCancelModal>
    );
};
