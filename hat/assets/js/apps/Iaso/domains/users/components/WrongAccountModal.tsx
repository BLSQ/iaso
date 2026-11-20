import React, { FunctionComponent, useState } from 'react';

import WarningIcon from '@mui/icons-material/Warning';

import Box from '@mui/material/Box/Box';
import Button from '@mui/material/Button/Button';
import Dialog from '@mui/material/Dialog/Dialog';
import DialogActions from '@mui/material/DialogActions/DialogActions';
import DialogContent from '@mui/material/DialogContent/DialogContent';
import DialogTitle from '@mui/material/DialogTitle/DialogTitle';

import makeStyles from '@mui/styles/makeStyles/makeStyles';
import { useSafeIntl, commonStyles } from 'bluesquare-components';

import MESSAGES from '../messages';

type Props = {
    isOpen: boolean;
};
const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    paper: {
        overflow: 'visible',
    },
    title: {
        paddingBottom: 0,
        '& h2': {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        },
    },
    content: {
        overflow: 'visible',
        paddingBottom: theme.spacing(2),
    },
    action: {
        paddingBottom: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
}));
const WrongAccountModal: FunctionComponent<Props> = ({ isOpen }) => {
    const [open, setOpen] = useState<boolean>(isOpen);
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const handleConfirm = () => {
        setOpen(false);
        window.location.href = '/logout-iaso';
    };

    return (
        <Dialog
            fullWidth
            maxWidth="xs"
            open={open}
            classes={{
                paper: classes.paper,
            }}
            onClose={() => setOpen(false)}
            scroll="body"
            id="wrong-account-dialog"
            data-test="wrong-account-dialog"
        >
            <DialogTitle className={classes.title}>
                <WarningIcon color="error" />
                <Box display="inline-block" mr={1} ml={1}>
                    {formatMessage(MESSAGES.wrongAccountTitle)}
                </Box>
                <WarningIcon color="error" />
            </DialogTitle>
            <DialogContent className={classes.content}>
                {formatMessage(MESSAGES.wrongAccount)}
            </DialogContent>
            <DialogActions className={classes.action}>
                <Button
                    onClick={() => setOpen(false)}
                    color="primary"
                    data-test="cancel-button"
                >
                    {formatMessage(MESSAGES.cancel)}
                </Button>
                <Button
                    onClick={handleConfirm}
                    color="primary"
                    data-test="confirm-button"
                >
                    {formatMessage(MESSAGES.logout)}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { WrongAccountModal };
