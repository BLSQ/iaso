import React, { useCallback, FunctionComponent } from 'react';
import { DialogContentText } from '@mui/material';
import {
    IconButton as IconButtonComponent,
    IntlMessage,
} from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import ConfirmCancelDialogComponent from './ConfirmCancelDialogComponent';

import MESSAGES from './messages';

type Props = {
    titleMessage: IntlMessage | string | React.ReactNode;
    message: IntlMessage;
    onConfirm: () => void;
    iconColor?: string;
    keyName?: string;
    Trigger: React.ComponentType<any>;
    triggerProps: Record<string, any>;
    disabled?: boolean;
};

const DeleteDialog: FunctionComponent<Props> = ({
    titleMessage,
    onConfirm,
    message = null,
    disabled = false,
    keyName = 'key',
    iconColor = 'action',
    Trigger = null,
    triggerProps = {},
}) => {
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
};

export default DeleteDialog;
