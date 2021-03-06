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
    additionalButton,
    additionalMessage,
    onAdditionalButtonClick,
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
            {additionalButton && additionalMessage && onAdditionalButtonClick && (
                <Button
                    onClick={() => onAdditionalButtonClick(closeDialog)}
                    color="primary"
                    disabled={!allowConfirm}
                >
                    <FormattedMessage {...additionalMessage} />
                </Button>
            )}
        </DialogActions>
    );
}
RawConfirmCancelActions.defaultProps = {
    additionalButton: false,
    additionalMessage: null,
    onAdditionalButtonClick: null,
};
RawConfirmCancelActions.propTypes = {
    classes: PropTypes.object.isRequired,
    closeDialog: PropTypes.func.isRequired,
    allowConfirm: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    confirmMessage: PropTypes.object.isRequired, // TODO: make a message prop type
    onCancel: PropTypes.func.isRequired,
    cancelMessage: PropTypes.object.isRequired, // TODO: make a message prop type
    additionalButton: PropTypes.bool,
    additionalMessage: PropTypes.object || null,
    onAdditionalButtonClick: PropTypes.func || null,
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
    additionalButton,
    additionalMessage,
    onAdditionalButtonClick,
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
                    additionalButton={additionalButton}
                    additionalMessage={additionalMessage}
                    onAdditionalButtonClick={onAdditionalButtonClick}
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
    onOpen: () => {},
    additionalButton: false,
    additionalMessage: null,
    onAdditionalButtonClick: null,
};
ConfirmCancelDialogComponent.propTypes = {
    allowConfirm: PropTypes.bool,
    onConfirm: PropTypes.func.isRequired,
    confirmMessage: PropTypes.object, // TODO: make a message prop type
    onCancel: PropTypes.func,
    cancelMessage: PropTypes.object, // TODO: make a message prop type
    maxWidth: PropTypes.string,
    onClosed: PropTypes.func,
    onOpen: PropTypes.func,
    additionalButton: PropTypes.bool,
    additionalMessage: PropTypes.object || null,
    onAdditionalButtonClick: PropTypes.func || null,
};
