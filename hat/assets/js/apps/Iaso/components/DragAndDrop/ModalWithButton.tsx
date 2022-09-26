/* eslint-disable react/jsx-props-no-spreading */
import React, { ComponentType, FunctionComponent, useState } from 'react';

type ModalComponentProps = { closeDialog: () => void; isOpen: boolean };
type ButtonComponentProps = { onClick: () => void };

type ModalProps<T extends ModalComponentProps> = Omit<
    T,
    'closeDialog' | 'isOpen'
>;
type ButtonProps<T extends ButtonComponentProps> = Omit<T, 'onClick'>;

type FullModalProps<
    T extends ModalComponentProps,
    U extends ButtonComponentProps,
> = ModalProps<T> & {
    iconProps: ButtonProps<U>;
};

export const makeFullModal =
    <T extends ModalComponentProps, U extends ButtonComponentProps>(
        ModalComponent: ComponentType<T>,
        ButtonComponent: ComponentType<U>,
    ): FunctionComponent<FullModalProps<T, U>> =>
    (props: FullModalProps<T, U>) => {
        const { iconProps, ...modalProps } = props;
        const [openModal, setOpenModal] = useState<boolean>(false);
        return (
            <>
                <ButtonComponent
                    {...({
                        ...iconProps,
                        onClick: () => setOpenModal(true),
                    } as U)}
                />
                {openModal && (
                    <ModalComponent
                        {...({
                            ...modalProps,
                            closeDialog: () => setOpenModal(false),
                            isOpen: openModal,
                        } as unknown as T)}
                    />
                )}
            </>
        );
    };
