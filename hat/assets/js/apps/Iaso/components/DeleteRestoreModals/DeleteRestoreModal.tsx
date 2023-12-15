import React, { FunctionComponent, ReactNode } from 'react';
import { IntlMessage, SimpleModal } from 'bluesquare-components';
import { YesNoButtons } from './YesNoButtons';

export type DeleteRestoreModalProps = {
    children: ReactNode;
    isOpen: boolean;
    closeDialog: () => void;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    id?: string;
    dataTestId?: string;
    titleMessage: string | IntlMessage | ReactNode;
    backdropClick?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
};
export const DeleteRestoreModal: FunctionComponent<DeleteRestoreModalProps> = ({
    children,
    isOpen,
    closeDialog: closeDialogProp,
    titleMessage,
    onConfirm,
    onCancel,
    id = 'deleteRestoreModal',
    maxWidth = 'sm',
    dataTestId = 'deleteRestoreModal',
    backdropClick = false,
}) => {
    const Buttons = ({ closeDialog: close }) => {
        return (
            <YesNoButtons
                closeDialog={close}
                onConfirm={onConfirm}
                onCancel={onCancel}
            />
        );
    };
    return (
        <SimpleModal
            open={isOpen}
            onClose={() => null}
            id={id}
            dataTestId={dataTestId}
            titleMessage={titleMessage}
            closeDialog={closeDialogProp}
            buttons={Buttons}
            maxWidth={maxWidth}
            backdropClick={backdropClick}
        >
            {children}
        </SimpleModal>
    );
};
