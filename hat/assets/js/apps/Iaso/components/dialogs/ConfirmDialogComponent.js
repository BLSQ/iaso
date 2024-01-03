import React, { Fragment } from 'react';

import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Button } from '@mui/material';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import MESSAGES from './messages';

const ConfirmDialog = ({
    btnMessage,
    message,
    question,
    confirm,
    reject,
    btnVariant,
    btnDisabled,
    btnSize,
    withDivider,
}) => {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
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
            <Button
                variant={btnVariant}
                size={btnSize}
                color="primary"
                disabled={btnDisabled}
                onClick={() => handleClickOpen()}
            >
                {btnMessage}
            </Button>
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

ConfirmDialog.defaultProps = {
    reject: () => null,
    btnDisabled: false,
    btnVariant: 'outlined',
    message: '',
    btnSize: 'medium',
    withDivider: false,
};

ConfirmDialog.propTypes = {
    question: PropTypes.any.isRequired,
    message: PropTypes.any,
    btnMessage: PropTypes.any.isRequired,
    confirm: PropTypes.func.isRequired,
    reject: PropTypes.func,
    btnDisabled: PropTypes.bool,
    btnVariant: PropTypes.string,
    btnSize: PropTypes.string,
    withDivider: PropTypes.bool,
};

export default ConfirmDialog;
