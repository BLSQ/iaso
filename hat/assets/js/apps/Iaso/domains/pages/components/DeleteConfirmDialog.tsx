import React, { FunctionComponent } from 'react';
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

type Props = {
    isOpen?: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

const DeleteConfirmDialog: FunctionComponent<Props> = ({
    isOpen = false,
    onClose = () => null,
    onConfirm = () => null,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();

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
                {formatMessage(MESSAGES.deleteDialiogTitle)}
            </DialogTitle>
            <DialogContent className={classes.content}>
                {formatMessage(MESSAGES.deleteDialiogContent)}
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

export default DeleteConfirmDialog;
