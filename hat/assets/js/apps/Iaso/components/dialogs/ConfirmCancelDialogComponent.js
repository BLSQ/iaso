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
    allowConfimAdditionalButton,
}) {
    return (
        <DialogActions className={classes.action}>
            <Button
                onClick={() => onCancel(closeDialog)}
                color="primary"
                data-test="cancel-button"
            >
                <FormattedMessage {...cancelMessage} />
            </Button>
            <Button
                data-test="confirm-button"
                onClick={() => onConfirm(closeDialog)}
                disabled={!allowConfirm}
                color="primary"
                autoFocus
            >
                <FormattedMessage {...confirmMessage} />
            </Button>
            {additionalButton && additionalMessage && onAdditionalButtonClick && (
                <Button
                    data-test="additional-button"
                    onClick={() => onAdditionalButtonClick(closeDialog)}
                    color="primary"
                    disabled={
                        allowConfimAdditionalButton !== null &&
                        allowConfimAdditionalButton !== undefined
                            ? !allowConfimAdditionalButton
                            : !allowConfirm
                    }
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
    allowConfimAdditionalButton: null,
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
    allowConfimAdditionalButton: PropTypes.bool,
};
export const ConfirmCancelActions = withStyles(actionStyles)(
    RawConfirmCancelActions,
);
/** @deprecated */
/** Use `ConfirmCancelModal` from bluesquare-components instead */
const ConfirmCancelDialogComponent = ({
    allowConfirm,
    onConfirm,
    confirmMessage,
    onCancel,
    cancelMessage,
    additionalButton,
    additionalMessage,
    onAdditionalButtonClick,
    allowConfimAdditionalButton,
    id,
    dataTestId,
    ...dialogProps
}) => {
    return (
        <DialogComponent
            dataTestId={dataTestId}
            id={id}
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
                    allowConfimAdditionalButton={allowConfimAdditionalButton}
                />
            )}
            {...dialogProps}
        />
    );
};
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
    allowConfimAdditionalButton: null,
    id: undefined,
    dataTestId: '',
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
    allowConfimAdditionalButton: PropTypes.bool,
    id: PropTypes.string,
    dataTestId: PropTypes.string,
};

export default ConfirmCancelDialogComponent;
