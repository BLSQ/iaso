import React, { useCallback } from 'react';
import { DialogContentText } from '@mui/material';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import ConfirmCancelDialogComponent from './ConfirmCancelDialogComponent';

import MESSAGES from './messages';

export default function DeleteDialog({
    titleMessage,
    message,
    onConfirm,
    disabled,
    keyName,
    iconColor,
    Trigger,
    triggerProps,
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
            renderTrigger={({ openDialog }) =>
                Trigger ? (
                    <Trigger onClick={openDialog} {...triggerProps} />
                ) : (
                    <IconButtonComponent
                        onClick={openDialog}
                        dataTestId={`delete-dialog-button-${keyName}`}
                        disabled={disabled}
                        icon="delete"
                        tooltipMessage={MESSAGES.delete}
                        color={iconColor}
                        {...iconButtonExtraProps}
                    />
                )
            }
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
    Trigger: null,
    triggerProps: {},
};
DeleteDialog.propTypes = {
    titleMessage: PropTypes.object.isRequired,
    message: PropTypes.object,
    onConfirm: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    keyName: PropTypes.string,
    iconColor: PropTypes.string,
    Trigger: PropTypes.elementType,
    triggerProps: PropTypes.object,
};
