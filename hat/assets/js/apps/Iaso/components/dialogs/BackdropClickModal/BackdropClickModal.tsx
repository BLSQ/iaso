import {
    ConfirmCancelModal,
    useSafeIntl,
    IntlMessage,
} from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { Box, Divider, Typography } from '@material-ui/core';
import MESSAGES from './messages';

type Props = {
    onConfirm: () => void;
    open: boolean;
    closeDialog: () => void;
    dataTestId?: string;
    id?: string;
    title?: string;
    confirmMessage?: IntlMessage;
    cancelMessage?: IntlMessage;
};

export const BackdropClickModal: FunctionComponent<Props> = ({
    onConfirm,
    open,
    closeDialog,
    dataTestId = 'backdropclick-modal',
    id = 'backdropclick-modal',
    title: titleProps,
    confirmMessage = MESSAGES.proceed,
    cancelMessage = MESSAGES.cancel,
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
                    <Typography>
                        {formatMessage(MESSAGES.unsavedDataWillBeLost)}
                    </Typography>
                </Box>
            </>
        </ConfirmCancelModal>
    );
};
