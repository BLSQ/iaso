import React, { useState } from 'react';

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
    classes, children, titleMessage, renderActions, renderTrigger, maxWidth,
}) {
    const [open, setOpen] = useState(false);
    const openDialog = () => setOpen(true);
    const closeDialog = () => setOpen(false);

    return (
        <>
            {renderTrigger({ openDialog })}
            <Dialog
                fullWidth
                maxWidth={maxWidth}
                open={open}
                classes={{
                    paper: classes.paper,
                }}
                onBackdropClick={closeDialog}
            >
                <DialogTitle className={classes.title}>
                    <FormattedMessage {...titleMessage} />
                </DialogTitle>
                <DialogContent className={classes.content}>
                    {children}
                </DialogContent>
                {renderActions({ closeDialog })}
            </Dialog>
        </>
    );
}
DialogComponent.defaultProps = {
    maxWidth: 'sm',
};
DialogComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired,
    titleMessage: PropTypes.object.isRequired, // TODO: make a message prop type
    maxWidth: PropTypes.string,
    renderActions: PropTypes.func.isRequired,
    renderTrigger: PropTypes.func.isRequired,
};
export default withStyles(styles)(DialogComponent);
