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
            renderTrigger={({ openDialog }) => (
                <IconButtonComponent
                    onClick={openDialog}
                    disabled={disabled}
                    icon="delete"
                    tooltipMessage={MESSAGES.delete}
                />
            )}
        >
            <div id={`delete-dialog-${keyName}`}>
                <DialogContentText id="alert-dialog-description">
                    <FormattedMessage {...message} />
                </DialogContentText>
            </div>
        </ConfirmCancelDialogComponent>
    );
}

DeleteDialog.defaultProps = {
    disabled: false,
    keyName: '-key',
};
DeleteDialog.propTypes = {
    titleMessage: PropTypes.object.isRequired,
    message: PropTypes.object.isRequired,
    onConfirm: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    keyName: PropTypes.string,
};
