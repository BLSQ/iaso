import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import {
    withStyles,
    IconButton,
    Tooltip,
    DialogContentText,
} from '@material-ui/core';
import Delete from '@material-ui/icons/Delete';

import commonStyles from '../../styles/common';
import ConfirmCancelDialogComponent from './ConfirmCancelDialogComponent';

const triggerStyles = theme => ({
    popperFixed: {
        ...commonStyles(theme).popperFixed,
        marginTop: theme.spacing(1),
    },
});

function RawDeleteTrigger({ classes, disabled, openDialog }) {
    return (
        <Tooltip
            classes={{ popper: classes.popperFixed }}
            disableFocusListener={disabled}
            disableHoverListener={disabled}
            disableTouchListener={disabled}
            placement="bottom"
            title={<FormattedMessage id="iaso.label.delete" defaultMessage="Delete" />}
        >
            <span>
                <IconButton disabled={disabled} onClick={openDialog}>
                    <Delete />
                </IconButton>
            </span>
        </Tooltip>
    );
}
RawDeleteTrigger.propTypes = {
    classes: PropTypes.object.isRequired,
    disabled: PropTypes.bool.isRequired,
    openDialog: PropTypes.func.isRequired,
};
const DeleteTrigger = withStyles(triggerStyles)(RawDeleteTrigger);

export default function DeleteDialog({
    titleMessage, message, onConfirm, disabled,
}) {
    const closeThenOnConfirm = useCallback((closeDialog) => {
        closeDialog();
        onConfirm();
    }, [onConfirm]);

    return (
        <ConfirmCancelDialogComponent
            titleMessage={titleMessage}
            onConfirm={closeThenOnConfirm}
            renderTrigger={({ openDialog }) => <DeleteTrigger openDialog={openDialog} disabled={disabled} />}
        >
            <DialogContentText id="alert-dialog-description">
                <FormattedMessage {...message} />
            </DialogContentText>
        </ConfirmCancelDialogComponent>
    );
}

DeleteDialog.defaultProps = {
    disabled: false,
};
DeleteDialog.propTypes = {
    titleMessage: PropTypes.object.isRequired,
    message: PropTypes.object.isRequired,
    onConfirm: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};
