import React, { useState, useCallback } from 'react';

import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { withStyles } from '@mui/styles';
import { commonStyles } from 'bluesquare-components';

const styles = theme => ({
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
});

const normalizedMessage = CompOrMessage => {
    if (!CompOrMessage) {
        return '';
    }
    if (CompOrMessage.id) {
        // eslint-disable-next-line react/jsx-props-no-spreading
        return <FormattedMessage {...CompOrMessage} />;
    }
    return CompOrMessage;
};

function DialogComponent({
    classes,
    children,
    titleMessage,
    renderActions,
    renderTrigger,
    maxWidth,
    onClosed,
    onOpen,
    id,
    dataTestId,
}) {
    // we use the renderDialog flag in addition to the open flag to control whether to render the full dialog
    // content, or only the trigger (to avoid rendering multiple heavy contents in list)
    const [open, setOpen] = useState(false);
    const [renderDialog, setRenderDialog] = useState(false);
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
                    onClose={(event, reason) => {
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
}
DialogComponent.defaultProps = {
    maxWidth: 'sm',
    onClosed: () => {},
    onOpen: () => {},
    titleMessage: null,
    id: undefined,
    dataTestId: '',
    children: null,
};
DialogComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.node,
    titleMessage: PropTypes.oneOfType([
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            defaultMessage: PropTypes.string,
            values: PropTypes.object,
        }),
        PropTypes.node,
        PropTypes.string, // untranslated not recommended
    ]),
    maxWidth: PropTypes.string,
    renderActions: PropTypes.func.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    onClosed: PropTypes.func,
    onOpen: PropTypes.func,
    id: PropTypes.string,
    dataTestId: PropTypes.string,
};
export default withStyles(styles)(DialogComponent);
