import {
    ConfirmCancelModal,
    IntlMessage,
    useSafeIntl,
} from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { Box, Divider, Typography } from '@mui/material';
import { MESSAGES } from './messages';
import { noOp } from '../../../../utils';

type Props = {
    open: boolean;
    closeDialog: () => void;
    onConfirm: () => void;
    titleMessage?: IntlMessage;
    bodyMessage?: IntlMessage;
};

export const WarningModal: FunctionComponent<Props> = ({
    open,
    closeDialog,
    onConfirm,
    titleMessage = MESSAGES.createUserWithoutPerm,
    bodyMessage = MESSAGES.warningModalMessage,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <ConfirmCancelModal
            open={open}
            id="user-WarningModal"
            dataTestId="user-WarningModal"
            titleMessage={formatMessage(titleMessage)}
            onClose={noOp}
            closeDialog={closeDialog}
            onConfirm={onConfirm}
            onCancel={noOp}
            confirmMessage={MESSAGES.confirm}
            cancelMessage={MESSAGES.cancel}
        >
            <Divider />
            <Box mt={2}>
                <Typography>{formatMessage(bodyMessage)}</Typography>
            </Box>
        </ConfirmCancelModal>
    );
};
