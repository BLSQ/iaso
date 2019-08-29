import React, { Fragment } from 'react';

import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';

const ConfirmDialog = ({
    btnMessage, message, question, confirm, reject,
}) => {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = (isAccepted) => {
        setOpen(false);
        if (isAccepted) {
            confirm();
        } else {
            reject();
        }
    };

    return (
        <Fragment>
            <Button
                variant="outlined"
                color="primary"
                onClick={() => handleClickOpen()}
                size="small"
            >
                {btnMessage}
            </Button>
            <Dialog
                open={open}
                onClick={() => handleClose(false)}
            >
                <DialogTitle>{question}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleClose(false)} color="primary">
                        <FormattedMessage
                            id="iaso.label.no"
                            defaultMessage="No"
                        />
                    </Button>
                    <Button onClick={() => handleClose(true)} color="primary" autoFocus>
                        <FormattedMessage
                            id="iaso.label.yes"
                            defaultMessage="Yes"
                        />
                    </Button>
                </DialogActions>
            </Dialog>
        </Fragment>
    );
};

ConfirmDialog.defaultProps = {
    reject: () => null,
};

ConfirmDialog.propTypes = {
    question: PropTypes.object.isRequired,
    message: PropTypes.object.isRequired,
    btnMessage: PropTypes.object.isRequired,
    confirm: PropTypes.func.isRequired,
    reject: PropTypes.func,
};

export default ConfirmDialog;
