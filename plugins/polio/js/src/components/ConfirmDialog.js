import React from 'react';

import { Button, Dialog, DialogActions, DialogTitle } from '@mui/material';
import PropTypes from 'prop-types';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../constants/messages';
import { useStyles } from '../styles/theme';

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();

    return (
        <Dialog
            fullWidth
            open={isOpen}
            onClose={(_event, reason) => {
                if (reason === 'backdropClick') {
                    onClose();
                }
            }}
        >
            <DialogTitle className={classes.title}>{title}</DialogTitle>
            <DialogActions className={classes.action}>
                <Button onClick={onClose} color="primary">
                    {formatMessage(MESSAGES.no)}
                </Button>
                <Button onClick={onConfirm} color="primary" autoFocus>
                    {formatMessage(MESSAGES.yes)}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

ConfirmDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};
