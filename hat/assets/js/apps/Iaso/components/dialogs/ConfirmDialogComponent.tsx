import React, { Fragment, FunctionComponent, ReactNode } from 'react';

import { Box, Button, Tooltip } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import { FormattedMessage } from 'react-intl';

import MESSAGES from './messages';

type Props = {
    btnMessage: string;
    message: string | ReactNode;
    question: string | ReactNode;
    confirm: () => void;
    reject?: () => void;
    btnVariant?: 'text' | 'outlined' | 'contained';
    btnDisabled?: boolean;
    btnSize?: 'small' | 'medium';
    withDivider?: boolean;
    tooltipMessage?: string;
    onOpen?: () => void;
};

const ConfirmDialog: FunctionComponent<Props> = ({
    btnMessage,
    message,
    question,
    confirm,
    reject = () => {},
    btnVariant = 'outlined',
    btnDisabled = false,
    btnSize = 'medium',
    withDivider = false,
    tooltipMessage,
    onOpen,
}) => {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
        onOpen?.();
    };

    const handleClose = isAccepted => {
        setOpen(false);
        if (isAccepted) {
            confirm();
        } else {
            reject();
        }
    };
    return (
        <>
            <Tooltip title={tooltipMessage}>
                <Box>
                    <Button
                        variant={btnVariant}
                        size={btnSize}
                        color="primary"
                        disabled={btnDisabled}
                        onClick={() => handleClickOpen()}
                    >
                        {btnMessage}
                    </Button>
                </Box>
            </Tooltip>
            <Dialog
                open={open}
                onClose={(event, reason) => {
                    if (reason === 'backdropClick') {
                        handleClose(false);
                    }
                }}
            >
                <DialogTitle>{question}</DialogTitle>
                {withDivider && <Divider />}
                {message !== '' && (
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            {message}
                        </DialogContentText>
                    </DialogContent>
                )}
                <DialogActions>
                    <Button onClick={() => handleClose(false)} color="primary">
                        <FormattedMessage {...MESSAGES.no} />
                    </Button>
                    <Button
                        onClick={() => handleClose(true)}
                        color="primary"
                        autoFocus
                    >
                        <FormattedMessage {...MESSAGES.yes} />
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ConfirmDialog;
