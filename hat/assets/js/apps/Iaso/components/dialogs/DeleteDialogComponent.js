import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { DialogContentText } from '@material-ui/core';

import { IconButton as IconButtonComponent } from 'bluesquare-components';
import ConfirmCancelDialogComponent from './ConfirmCancelDialogComponent';

import MESSAGES from './messages';

export default function DeleteDialog({
    titleMessage,
    message,
    onConfirm,
    disabled,
    keyName,
    iconColor,
}) {
    const closeThenOnConfirm = useCallback(
        closeDialog => {
            closeDialog();
            onConfirm();
        },
        [onConfirm],
    );

    const iconButtonExtraProps = keyName
        ? { id: `delete-button-${keyName}` }
        : {};

    return (
        <ConfirmCancelDialogComponent
            titleMessage={titleMessage}
            dataTestId={`delete-dialog-${keyName}`}
            onConfirm={closeThenOnConfirm}
            renderTrigger={({ openDialog }) => (
                <IconButtonComponent
                    onClick={openDialog}
                    dataTestId={`delete-dialog-button-${keyName}`}
                    disabled={disabled}
                    icon="delete"
                    tooltipMessage={MESSAGES.delete}
                    color={iconColor}
                    {...iconButtonExtraProps}
                />
            )}
        >
            <div id={`delete-dialog-${keyName}`}>
                {message && (
                    <DialogContentText id="alert-dialog-description">
                        <FormattedMessage {...message} />
                    </DialogContentText>
                )}
            </div>
        </ConfirmCancelDialogComponent>
    );
}

DeleteDialog.defaultProps = {
    disabled: false,
    keyName: 'key',
    message: null,
    iconColor: 'action',
};
DeleteDialog.propTypes = {
    titleMessage: PropTypes.object.isRequired,
    message: PropTypes.object,
    onConfirm: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    keyName: PropTypes.string,
    iconColor: PropTypes.string,
};
