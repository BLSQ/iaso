import React from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { makeStyles } from '@mui/styles';

import { commonStyles, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm }) => {
    const classes = useStyles();
    const intl = useSafeIntl();

    return (
        <Dialog
            fullWidth
            maxWidth="sm"
            open={isOpen}
            onClose={(event, reason) => {
                if (reason === 'backdropClick') {
                    onClose();
                }
            }}
        >
            <DialogTitle className={classes.title}>
                {intl.formatMessage(MESSAGES.deleteDialiogTitle)}
            </DialogTitle>
            <DialogContent className={classes.content}>
                {intl.formatMessage(MESSAGES.deleteDialiogContent)}
            </DialogContent>
            <DialogActions className={classes.action}>
                <Button onClick={onClose} color="primary">
                    {intl.formatMessage(MESSAGES.no)}
                </Button>
                <Button onClick={onConfirm} color="primary" autoFocus>
                    {intl.formatMessage(MESSAGES.yes)}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

DeleteConfirmDialog.defaultProps = {
    isOpen: false,
    onClose: () => null,
    onConfirm: () => null,
};

DeleteConfirmDialog.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    onConfirm: PropTypes.func,
};

export default DeleteConfirmDialog;
