import React from 'react';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../constants/messages';
import { useStyles } from '../styles/theme';

export const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm }) => {
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
            <DialogTitle className={classes.title}>
                {formatMessage(MESSAGES.deleteWarning)}
            </DialogTitle>
            <DialogContent className={classes.content}>
                {formatMessage(MESSAGES.operationCantBeUndone)}
            </DialogContent>
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
