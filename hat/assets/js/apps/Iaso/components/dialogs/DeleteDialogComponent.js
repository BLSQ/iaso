import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { DialogContentText } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';

import ConfirmCancelDialogComponent from './ConfirmCancelDialogComponent';
import IconButtonComponent from '../buttons/IconButtonComponent';

import MESSAGES from './messages';

export default function DeleteDialog({
    titleMessage,
    message,
    onConfirm,
    disabled,
    onlyIcon,
}) {
    const closeThenOnConfirm = useCallback(
        closeDialog => {
            closeDialog();
            onConfirm();
        },
        [onConfirm],
    );

    return (
        <ConfirmCancelDialogComponent
            titleMessage={titleMessage}
            onConfirm={closeThenOnConfirm}
            renderTrigger={({ openDialog }) => {
                if (onlyIcon) {
                    return (
                        <DeleteIcon onClick={openDialog} disabled={disabled} />
                    );
                }
                return (
                    <IconButtonComponent
                        onClick={openDialog}
                        disabled={disabled}
                        icon="delete"
                        tooltipMessage={MESSAGES.delete}
                    />
                );
            }}
        >
            <DialogContentText id="alert-dialog-description">
                <FormattedMessage {...message} />
            </DialogContentText>
        </ConfirmCancelDialogComponent>
    );
}

DeleteDialog.defaultProps = {
    disabled: false,
    onlyIcon: false,
};
DeleteDialog.propTypes = {
    titleMessage: PropTypes.object.isRequired,
    message: PropTypes.object.isRequired,
    onConfirm: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    onlyIcon: PropTypes.bool,
};
