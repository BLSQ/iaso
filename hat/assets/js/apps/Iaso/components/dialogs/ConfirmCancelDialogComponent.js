import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Button, DialogActions, withStyles } from '@material-ui/core';

import DialogComponent from './DialogComponent';
import MESSAGES from './messages';

const actionStyles = theme => ({
    action: {
        paddingBottom: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
});

function RawConfirmCancelActions({
    classes,
    closeDialog,
    allowConfirm,
    onConfirm,
    confirmMessage,
    onCancel,
    cancelMessage,
}) {
    return (
        <DialogActions className={classes.action}>
            <Button onClick={() => onCancel(closeDialog)} color="primary">
                <FormattedMessage {...cancelMessage} />
            </Button>
            <Button
                onClick={() => onConfirm(closeDialog)}
                disabled={!allowConfirm}
                color="primary"
                autoFocus
            >
                <FormattedMessage {...confirmMessage} />
            </Button>
        </DialogActions>
    );
}
RawConfirmCancelActions.propTypes = {
    classes: PropTypes.object.isRequired,
    closeDialog: PropTypes.func.isRequired,
    allowConfirm: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    confirmMessage: PropTypes.object.isRequired, // TODO: make a message prop type
    onCancel: PropTypes.func.isRequired,
    cancelMessage: PropTypes.object.isRequired, // TODO: make a message prop type
};
export const ConfirmCancelActions = withStyles(actionStyles)(
    RawConfirmCancelActions,
);

export default function ConfirmCancelDialogComponent({
    allowConfirm,
    onConfirm,
    confirmMessage,
    onCancel,
    cancelMessage,
    ...dialogProps
}) {
    return (
        <DialogComponent
            renderActions={({ closeDialog }) => (
                <ConfirmCancelActions
                    allowConfirm={allowConfirm}
                    onConfirm={onConfirm}
                    confirmMessage={confirmMessage}
                    onCancel={onCancel}
                    cancelMessage={cancelMessage}
                    closeDialog={closeDialog}
                />
            )}
            {...dialogProps}
        />
    );
}
ConfirmCancelDialogComponent.defaultProps = {
    allowConfirm: true,
    onCancel: closeDialog => closeDialog(),
    confirmMessage: MESSAGES.yes,
    cancelMessage: MESSAGES.no,
    maxWidth: 'sm',
    onClosed: () => {},
};
ConfirmCancelDialogComponent.propTypes = {
    allowConfirm: PropTypes.bool,
    onConfirm: PropTypes.func.isRequired,
    confirmMessage: PropTypes.object, // TODO: make a message prop type
    onCancel: PropTypes.func,
    cancelMessage: PropTypes.object, // TODO: make a message prop type
    maxWidth: PropTypes.string,
    onClosed: PropTypes.func,
};
