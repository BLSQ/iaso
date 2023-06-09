import { ConfirmCancelModal, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { Box, Divider, Typography } from '@material-ui/core';
import { MESSAGES } from './messages';

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
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onClose={() => {}}
            closeDialog={closeDialog}
            onConfirm={onConfirm}
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onCancel={() => {}}
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
