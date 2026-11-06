import React, { FunctionComponent } from 'react';
import Box from '@mui/material/Box/Box';
import Divider from '@mui/material/Divider/Divider';
import Typography from '@mui/material/Typography/Typography';
import { ConfirmCancelModal } from 'bluesquare-components';
import { noOp } from 'Iaso/utils';
import { MESSAGES } from './messages';

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
