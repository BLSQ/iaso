import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Button, DialogActions, withStyles } from '@material-ui/core';

import DialogComponent from './DialogComponent';

const styles = theme => ({
    action: {
        paddingBottom: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
});

function FormActions({
    classes, closeDialog, allowSave, onSave, onCancel,
}) {
    return (
        <DialogActions className={classes.action}>
            <Button onClick={() => onCancel(closeDialog)} color="primary">
                <FormattedMessage
                    id="iaso.label.cancel"
                    defaultMessage="Cancel"
                />
            </Button>
            <Button
                onClick={() => onSave(closeDialog)}
                disabled={!allowSave}
                color="primary"
                autoFocus
            >
                <FormattedMessage
                    id="iaso.label.save"
                    defaultMessage="Save"
                />
            </Button>
        </DialogActions>
    );
}
FormActions.propTypes = {
    classes: PropTypes.object.isRequired,
    closeDialog: PropTypes.func.isRequired,
    allowSave: PropTypes.bool.isRequired,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};
const StyledFormActions = withStyles(styles)(FormActions);

export default function FormDialogComponent({
    allowSave, onSave, onCancel, ...dialogProps
}) {
    return (
        <DialogComponent
            renderActions={({ closeDialog }) => (
                <StyledFormActions
                    allowSave={allowSave}
                    onSave={onSave}
                    onCancel={onCancel}
                    closeDialog={closeDialog}
                />
            )}
            {...dialogProps}
        />
    );
}
FormDialogComponent.defaultProps = {
    allowSave: true,
    onCancel: closeDialog => closeDialog(),
};
FormDialogComponent.propTypes = {
    allowSave: PropTypes.bool,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    ...DialogComponent.commonPropTypes,
};
