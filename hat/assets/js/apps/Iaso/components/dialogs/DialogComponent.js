import React, { useState } from 'react';

import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Add from '@material-ui/icons/Add';
import {
    withStyles,
    Button,
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
    classes, children, openButtonColor, openButtonMessage, dialogTitleMessage, renderActions,
}) {
    const [open, setOpen] = useState(false);
    const closeDialog = () => setOpen(false);
    const computedOpenButtonMessage = openButtonMessage !== null ? openButtonMessage : dialogTitleMessage;

    return (
        <>
            <Button
                variant="contained"
                className={classes.button}
                color={openButtonColor}
                onClick={() => setOpen(true)}
            >
                <Add className={classes.buttonIcon} />
                <FormattedMessage
                    id={computedOpenButtonMessage.id}
                    defaultMessage={computedOpenButtonMessage.defaultMessage}
                />
            </Button>
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
                        defaultMessage={dialogTitleMessage.message}
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
};
DialogComponent.defaultProps = {
    openButtonColor: 'primary',
    openButtonMessage: null,
};
DialogComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired,
    openButtonColor: PropTypes.string,
    openButtonMessage: PropTypes.object, // TODO: make a message prop type
    renderActions: PropTypes.func.isRequired,
    ...commonPropTypes,
};
DialogComponent.commonPropTypes = commonPropTypes;
export default withStyles(styles)(DialogComponent);
