import React, { FunctionComponent, ReactNode } from 'react';
import { defineMessages } from 'react-intl';
import { IntlMessage, SimpleModal, useSafeIntl } from 'bluesquare-components';
import { Button } from '@material-ui/core';

type ButtonProps = { closeDialog: () => void };

const MESSAGES = defineMessages({
    close: {
        defaultMessage: 'Close',
        id: 'blsq.buttons.label.close',
    },
});

type Props = {
    children: ReactNode;
    isOpen: boolean;
    closeDialog: () => void;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    id?: string;
    dataTestId?: string;
    titleMessage: string | IntlMessage | ReactNode;
    backdropClick?: boolean;
};
export const AlertModal: FunctionComponent<Props> = ({
    children,
    isOpen,
    closeDialog: closeDialogProp,
    titleMessage,
    id = 'alertModal',
    maxWidth = 'sm',
    dataTestId = 'alertModal',
    backdropClick = true,
}) => {
    const CloseButton: FunctionComponent<ButtonProps> = ({ closeDialog }) => {
        const { formatMessage } = useSafeIntl();
        return (
            <Button onClick={closeDialog} variant="contained" color="primary">
                {formatMessage(MESSAGES.close)}
            </Button>
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
            buttons={CloseButton}
            maxWidth={maxWidth}
            backdropClick={backdropClick}
        >
            {children}
        </SimpleModal>
    );
};
