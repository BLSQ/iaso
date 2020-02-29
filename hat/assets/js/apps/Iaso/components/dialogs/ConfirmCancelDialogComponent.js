import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Button, DialogActions, withStyles } from '@material-ui/core';

import DialogComponent from './DialogComponent';

const actionStyles = theme => ({
    action: {
        paddingBottom: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
});

function RawConfirmCancelActions({
    classes, closeDialog, allowSave, onConfirm, confirmMessage, onCancel, cancelMessage,
}) {
    return (
        <DialogActions className={classes.action}>
            <Button onClick={() => onCancel(closeDialog)} color="primary">
                <FormattedMessage {...cancelMessage} />
            </Button>
            <Button
                onClick={() => onConfirm(closeDialog)}
                disabled={!allowSave}
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
    allowSave: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    confirmMessage: PropTypes.object.isRequired, // TODO: make a message prop type
    onCancel: PropTypes.func.isRequired,
    cancelMessage: PropTypes.object.isRequired, // TODO: make a message prop type
};
const ConfirmCancelActions = withStyles(actionStyles)(RawConfirmCancelActions);

export default function ConfirmCancelDialogComponent({
    allowSave, onConfirm, confirmMessage, onCancel, cancelMessage, ...dialogProps
}) {
    return (
        <DialogComponent
            renderActions={({ closeDialog }) => (
                <ConfirmCancelActions
                    allowSave={allowSave}
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
    allowSave: true,
    onCancel: closeDialog => closeDialog(),
    confirmMessage: { id: 'iaso.label.yes', defaultMessage: 'Yes' },
    cancelMessage: { id: 'iaso.label.no', defaultMessage: 'No' },
};
ConfirmCancelDialogComponent.propTypes = {
    allowSave: PropTypes.bool,
    onConfirm: PropTypes.func.isRequired,
    confirmMessage: PropTypes.object, // TODO: make a message prop type
    onCancel: PropTypes.func,
    cancelMessage: PropTypes.object, // TODO: make a message prop type
    ...DialogComponent.commonPropTypes,
};
