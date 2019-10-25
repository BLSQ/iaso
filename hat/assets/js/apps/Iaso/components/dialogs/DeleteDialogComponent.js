import React, { Fragment } from 'react';

import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Delete from '@material-ui/icons/Delete';
import {
    IconButton,
    Tooltip,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@material-ui/core';

const DeleteDialog = ({
    message, question, confirm, reject, disabled,
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
            <Tooltip placement="bottom" title={<FormattedMessage id="iaso.label.delete" defaultMessage="Delete" />}>
                <span>
                    <IconButton
                        disabled={disabled}
                        onClick={() => handleClickOpen()}
                    >
                        <Delete />
                    </IconButton>
                </span>
            </Tooltip>
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

DeleteDialog.defaultProps = {
    reject: () => null,
    disabled: false,
};

DeleteDialog.propTypes = {
    question: PropTypes.any.isRequired,
    message: PropTypes.any.isRequired,
    confirm: PropTypes.func.isRequired,
    reject: PropTypes.func,
    disabled: PropTypes.bool,
};

export default DeleteDialog;
