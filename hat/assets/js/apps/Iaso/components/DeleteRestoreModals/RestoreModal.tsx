import { makeFullModal } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { RestoreButton } from './RestoreButton';
import {
    DeleteRestoreModal,
    DeleteRestoreModalProps,
} from './DeleteRestoreModal';
import { RestoreIconButton } from '../Buttons/RestoreIconButton';

const RestoreModalWithButton = makeFullModal(DeleteRestoreModal, RestoreButton);
const RestoreModalWithIconButton = makeFullModal(
    DeleteRestoreModal,
    RestoreIconButton,
);

type Props = Omit<DeleteRestoreModalProps, 'isOpen' | 'closeDialog'> & {
    type: 'button' | 'icon';
    iconProps: any;
};

export const RestoreModal: FunctionComponent<Props> = ({
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
            <RestoreModalWithIconButton
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
            </RestoreModalWithIconButton>
        );
    }
    return (
        <RestoreModalWithButton
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
        </RestoreModalWithButton>
    );
};
