import React, { FunctionComponent } from 'react';
import { Box, Divider, Typography } from '@mui/material';
import {
    ConfirmCancelModal,
    IntlMessage,
    useSafeIntl,
} from 'bluesquare-components';
import MESSAGES from '../../../constants/messages';

type Props = {
    onConfirm: () => void;
    open: boolean;
    closeDialog: () => void;
    dataTestId?: string;
    id?: string;
    title?: string;
    confirmMessage?: IntlMessage;
    cancelMessage?: IntlMessage;
    body: string;
};

export const WarningModal: FunctionComponent<Props> = ({
    onConfirm,
    open,
    closeDialog,
    dataTestId = 'warning-modal',
    id = 'warning-modal',
    title: titleProps,
    confirmMessage = MESSAGES.proceed,
    cancelMessage = MESSAGES.cancel,
    body,
}) => {
    const { formatMessage } = useSafeIntl();
    const title = titleProps || formatMessage(MESSAGES.doYouWantToClose);

    return (
        <ConfirmCancelModal
            onConfirm={onConfirm}
            onCancel={() => null}
            open={open}
            closeDialog={closeDialog}
            dataTestId={dataTestId}
            id={id}
            onClose={() => null}
            titleMessage={title}
            confirmMessage={confirmMessage}
            cancelMessage={cancelMessage}
        >
            <>
                <Divider />
                <Box mt={2}>
                    <Typography>{body}</Typography>
                </Box>
            </>
        </ConfirmCancelModal>
    );
};
