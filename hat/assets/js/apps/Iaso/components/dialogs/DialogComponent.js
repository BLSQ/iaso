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
    classes, children, dialogTitleMessage, renderActions, renderTrigger,
}) {
    const [open, setOpen] = useState(false);
    const openDialog = () => setOpen(true);
    const closeDialog = () => setOpen(false);

    return (
        <>
            {renderTrigger({ openDialog })}
            <Dialog
                fullWidth
                maxWidth="md"
                open={open}
                classes={{
                    paper: classes.paper,
                }}
            >
                <DialogTitle className={classes.title}>
                    <FormattedMessage
                        id={dialogTitleMessage.id}
                        defaultMessage={dialogTitleMessage.defaultMessage}
                    />
                </DialogTitle>
                <DialogContent className={classes.content}>
                    {children}
                </DialogContent>
                {renderActions({ closeDialog })}
            </Dialog>
        </>
    );
}
const commonPropTypes = {
    dialogTitleMessage: PropTypes.object.isRequired, // TODO: make a message prop type
    renderTrigger: PropTypes.func.isRequired,
};
DialogComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired,
    renderActions: PropTypes.func.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    ...commonPropTypes,
};
DialogComponent.commonPropTypes = commonPropTypes;
export default withStyles(styles)(DialogComponent);
