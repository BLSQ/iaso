/* eslint-disable react/jsx-props-no-spreading */
import React, { ComponentType, FunctionComponent, useState } from 'react';
// @ts-ignore
import { IconButton as IconButtonComponent } from 'bluesquare-components';

import { IntlMessage } from '../../types/intl';

type ModalComponentProps = { closeDialog: () => void; isOpen: boolean };

type FullModalProps<T extends ModalComponentProps> = {
    icon?: string;
    overrideIcon?: string;
    tooltipMessage: IntlMessage;
} & Omit<T, 'closeDialog' | 'isOpen'>;

export const makeFullModal =
    <T extends ModalComponentProps>(
        ModalComponent: ComponentType<T>,
    ): FunctionComponent<FullModalProps<T>> =>
    (props: FullModalProps<T>) => {
        const { icon, overrideIcon, tooltipMessage, ...modalProps } = props;
        const [openModal, setOpenModal] = useState<boolean>(false);
        return (
            <>
                <IconButtonComponent
                    onClick={() => setOpenModal(true)}
                    icon={icon}
                    tooltipMessage={tooltipMessage}
                    overrideIcon={overrideIcon}
                />
                {openModal && (
                    <ModalComponent
                        {...(modalProps as unknown as T)}
                        closeDialog={() => setOpenModal(false)}
                        isOpen={openModal}
                    />
                )}
            </>
        );
    };
