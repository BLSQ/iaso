import React, { FunctionComponent } from 'react';
import { makeFullModal } from 'bluesquare-components';
import { DeleteIconButton } from '../Buttons/DeleteIconButton';
import { DeleteButton } from './DeleteButton';
import {
    DeleteRestoreModal,
    DeleteRestoreModalProps,
} from './DeleteRestoreModal';

const DeleteModalWithButton = makeFullModal(DeleteRestoreModal, DeleteButton);
const DeleteModalWithIconButton = makeFullModal(
    DeleteRestoreModal,
    DeleteIconButton,
);

type Props = Omit<DeleteRestoreModalProps, 'isOpen' | 'closeDialog'> & {
    type: 'button' | 'icon';
    iconProps?: any;
};

export const DeleteModal: FunctionComponent<Props> = ({
    type,
    children,
    iconProps,
    titleMessage,
    onConfirm,
    onCancel,
    id = 'deleteModal',
    maxWidth = 'sm',
    dataTestId = 'deleteModal',
    backdropClick = false,
}) => {
    if (type === 'icon') {
        return (
            <DeleteModalWithIconButton
                titleMessage={titleMessage}
                onConfirm={onConfirm}
                onCancel={onCancel}
                id={id}
                maxWidth={maxWidth}
                dataTestId={dataTestId}
                iconProps={iconProps}
                backdropClick={backdropClick}
            >
                {children}
            </DeleteModalWithIconButton>
        );
    }
    return (
        <DeleteModalWithButton
            titleMessage={titleMessage}
            onConfirm={onConfirm}
            onCancel={onCancel}
            id={id}
            maxWidth={maxWidth}
            dataTestId={dataTestId}
            iconProps={iconProps}
            backdropClick={backdropClick}
        >
            {children}
        </DeleteModalWithButton>
    );
};
