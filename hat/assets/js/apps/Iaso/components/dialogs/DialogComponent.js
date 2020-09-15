import React, { useState, useCallback } from 'react';

import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import {
    withStyles,
    Dialog,
    DialogContent,
    DialogTitle,
} from '@material-ui/core';
import commonStyles from '../../styles/common';

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

function DialogComponent({
    classes,
    children,
    titleMessage,
    renderActions,
    renderTrigger,
    maxWidth,
    onClosed,
}) {
    // we use the renderDialog flag in addition to the open flag to control whether to render the full dialog
    // content, or only the trigger (to avoid rendering multiple heavy contents in list)
    const [open, setOpen] = useState(false);
    const [renderDialog, setRenderDialog] = useState(false);
    const openDialog = useCallback(() => {
        setOpen(true);
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
                    onBackdropClick={closeDialog}
                    scroll="body"
                >
                    <DialogTitle className={classes.title}>
                        <FormattedMessage {...titleMessage} />
                    </DialogTitle>
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
};
DialogComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired,
    titleMessage: PropTypes.object.isRequired, // TODO: make a message prop type
    maxWidth: PropTypes.string,
    renderActions: PropTypes.func.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    onClosed: PropTypes.func,
};
export default withStyles(styles)(DialogComponent);
