import { ConfirmCancelModal, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { Box, Divider, Typography } from '@mui/material';
import { MESSAGES } from './messages';
import { noOp } from '../../../../utils';

type Props = {
    open: boolean;
    closeDialog: () => void;
    onConfirm: () => void;
};

export const WarningModal: FunctionComponent<Props> = ({
    open,
    closeDialog,
    onConfirm,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <ConfirmCancelModal
            open={open}
            id="user-WarningModal"
            dataTestId="user-WarningModal"
            titleMessage={formatMessage(MESSAGES.createUserWithoutPerm)}
            onClose={noOp}
            closeDialog={closeDialog}
            onConfirm={onConfirm}
            onCancel={noOp}
            confirmMessage={MESSAGES.confirm}
            cancelMessage={MESSAGES.cancel}
        >
            <Divider />
            <Box mt={2}>
                <Typography>
                    {formatMessage(MESSAGES.warningModalMessage)}
                </Typography>
            </Box>
        </ConfirmCancelModal>
    );
};
