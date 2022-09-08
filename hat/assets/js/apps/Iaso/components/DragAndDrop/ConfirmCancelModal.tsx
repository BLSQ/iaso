import React, { FunctionComponent } from 'react';
import {
    ConfirmCancelButtons,
    ConfirmCancelButtonsProps,
} from './ConfirmCancelButtons';
import { SimpleDialogProps, SimpleModal } from './SimpleModal';

export type ConfirmCancelModalProps = Omit<SimpleDialogProps, 'buttons'> &
    ConfirmCancelButtonsProps;

export const ConfirmCancelModal: FunctionComponent<ConfirmCancelModalProps> = ({
    open = false,
    maxWidth = 'sm',
    onClose,
    id,
    dataTestId,
    titleMessage,
    children,
    closeDialog: closeDialogProp,
    allowConfirm = true,
    onConfirm,
    confirmMessage,
    onCancel,
    cancelMessage,
    additionalButton = false,
    additionalMessage,
    onAdditionalButtonClick,
    allowConfirmAdditionalButton = true,
}) => {
    const Buttons = ({ closeDialog }) => (
        <ConfirmCancelButtons
            closeDialog={closeDialog}
            allowConfirm={allowConfirm}
            onConfirm={onConfirm}
            confirmMessage={confirmMessage}
            onCancel={onCancel}
            cancelMessage={cancelMessage}
            additionalButton={additionalButton}
            additionalMessage={additionalMessage}
            onAdditionalButtonClick={onAdditionalButtonClick}
            allowConfirmAdditionalButton={allowConfirmAdditionalButton}
        />
    );
    return (
        <SimpleModal
            open={open}
            maxWidth={maxWidth}
            onClose={onClose}
            id={id}
            dataTestId={dataTestId}
            titleMessage={titleMessage}
            closeDialog={closeDialogProp}
            buttons={Buttons}
        >
            {children}
        </SimpleModal>
    );
};
