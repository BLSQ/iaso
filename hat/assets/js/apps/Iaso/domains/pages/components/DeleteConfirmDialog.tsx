import React, { FunctionComponent } from 'react';
import Button from '@mui/material/Button/Button';
import Dialog from '@mui/material/Dialog/Dialog';
import DialogActions from '@mui/material/DialogActions/DialogActions';
import DialogContent from '@mui/material/DialogContent/DialogContent';
import DialogTitle from '@mui/material/DialogTitle/DialogTitle';
import makeStyles from '@mui/styles/makeStyles/makeStyles';
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
