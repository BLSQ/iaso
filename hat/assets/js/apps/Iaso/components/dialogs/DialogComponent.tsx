import React, { FunctionComponent, useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, IntlMessage } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';

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
}));

const normalizedMessage = CompOrMessage => {
    if (!CompOrMessage) {
        return '';
    }
    if (CompOrMessage.id) {
        return <FormattedMessage {...CompOrMessage} />;
    }
    return CompOrMessage;
};

type Props = {
    children?: React.ReactNode;
    titleMessage?: IntlMessage | string | React.ReactNode;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    renderTrigger: ({
        openDialog,
    }: {
        openDialog: () => void;
    }) => React.JSX.Element;
    renderActions: ({
        closeDialog,
    }: {
        closeDialog: () => void;
    }) => React.JSX.Element;
    onClosed?: () => void;
    onOpen?: () => void;
    id?: string;
    dataTestId?: string;
    defaultOpen?: boolean;
};
/** deprecated */
const DialogComponent: FunctionComponent<Props> = ({
    children,
    titleMessage,
    renderActions,
    renderTrigger,
    maxWidth = 'sm',
    onClosed = () => {},
    onOpen = () => {},
    id,
    dataTestId = '',
    defaultOpen = false,
}) => {
    const classes = useStyles();
    // we use the renderDialog flag in addition to the open flag to control whether to render the full dialog
    // content, or only the trigger (to avoid rendering multiple heavy contents in list)
    const [open, setOpen] = useState(defaultOpen);
    const [renderDialog, setRenderDialog] = useState(defaultOpen);
    const openDialog = useCallback(() => {
        setOpen(true);
        onOpen();
        setRenderDialog(true);
    }, [setOpen, setRenderDialog]);
    const closeDialog = useCallback(() => {
        setOpen(false);
        onClosed();
        setTimeout(() => {
            if (!open) {
                setRenderDialog(false);
            }
        }, 1000);
    }, [setOpen, setRenderDialog, open]);

    return (
        <>
            {renderTrigger({ openDialog })}
            {renderDialog && (
                <Dialog
                    fullWidth
                    maxWidth={maxWidth}
                    open={open}
                    classes={{
                        paper: classes.paper,
                    }}
                    onClose={(_, reason) => {
                        if (reason === 'backdropClick') {
                            closeDialog();
                        }
                    }}
                    scroll="body"
                    id={id}
                    data-test={dataTestId}
                >
                    {titleMessage && (
                        <DialogTitle className={classes.title}>
                            {normalizedMessage(titleMessage)}
                        </DialogTitle>
                    )}
                    <DialogContent className={classes.content}>
                        {children}
                    </DialogContent>
                    {renderActions({ closeDialog })}
                </Dialog>
            )}
        </>
    );
};

export default DialogComponent;
