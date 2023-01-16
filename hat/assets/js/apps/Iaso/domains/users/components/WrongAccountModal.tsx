import React, { FunctionComponent, useState } from 'react';

import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    commonStyles,
} from 'bluesquare-components';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    makeStyles,
    Button,
} from '@material-ui/core';

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
                {formatMessage(MESSAGES.wrongAccountTitle)}
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
