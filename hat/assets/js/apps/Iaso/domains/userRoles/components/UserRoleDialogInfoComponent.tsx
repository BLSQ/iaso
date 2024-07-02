import React, { FunctionComponent } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { useSafeIntl } from 'bluesquare-components';
import { DialogContentText, Divider } from '@mui/material';
import MESSAGES from '../messages';

type Props = {
    infoOpen: boolean;
    // eslint-disable-next-line no-unused-vars
    setInfoOpen: (open: boolean) => void;
    closeDialog: () => void;
};

const UserRoleDialogInfoComponent: FunctionComponent<Props> = ({
    infoOpen,
    setInfoOpen,
    closeDialog,
}) => {
    const handleClose = () => {
        setInfoOpen(false);
        closeDialog();
    };
    const { formatMessage } = useSafeIntl();
    return (
        <Dialog open={infoOpen} onClose={handleClose}>
            <DialogTitle>
                {formatMessage(MESSAGES.userRoleDialogInfoTitle)}
            </DialogTitle>
            <Divider />
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {formatMessage(MESSAGES.userRoleDialogInfoMessage)}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        setInfoOpen(false);
                        closeDialog();
                    }}
                    color="primary"
                    autoFocus
                >
                    {formatMessage(MESSAGES.userRoleInfoButton)}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserRoleDialogInfoComponent;
