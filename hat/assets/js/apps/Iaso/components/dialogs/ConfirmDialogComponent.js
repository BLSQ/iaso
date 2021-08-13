import React, { Fragment } from 'react';

import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Button } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';

import MESSAGES from './messages';

const ConfirmDialog = ({
    btnMessage,
    message,
    question,
    confirm,
    reject,
    btnVariant,
    btnDisabled,
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
};

ConfirmDialog.propTypes = {
    question: PropTypes.any.isRequired,
    message: PropTypes.any,
    btnMessage: PropTypes.any.isRequired,
    confirm: PropTypes.func.isRequired,
    reject: PropTypes.func,
    btnDisabled: PropTypes.bool,
    btnVariant: PropTypes.string,
};

export default ConfirmDialog;
