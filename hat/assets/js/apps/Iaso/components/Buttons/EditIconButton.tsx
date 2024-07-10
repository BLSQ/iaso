import React, { FunctionComponent } from 'react';
import { IconButton, IntlMessage } from 'bluesquare-components';
import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    edit: {
        id: 'iaso.label.edit',
        defaultMessage: 'Edit',
    },
});

type Props = {
    onClick: () => void;
    message?: IntlMessage;
    disabled?: boolean;
    overrideIcon?: any;
};

export const EditIconButton: FunctionComponent<Props> = ({
    onClick,
    message,
    disabled = false,
    overrideIcon,
}) => {
    return (
        <IconButton
            onClick={onClick}
            icon="edit"
            overrideIcon={overrideIcon}
            tooltipMessage={message ?? MESSAGES.edit}
            disabled={disabled}
        />
    );
};
