import React, { FunctionComponent } from 'react';
import { IconButton, IntlMessage } from 'bluesquare-components';
import { defineMessages } from 'react-intl';

const messages = defineMessages({
    restore: {
        id: 'iaso.label.restore',
        defaultMessage: 'Restore',
    },
});

type Props = {
    onClick: () => void;
    message?: IntlMessage;
};

export const RestoreIconButton: FunctionComponent<Props> = ({
    onClick,
    message,
}) => {
    return (
        <IconButton
            onClick={onClick}
            icon="restore-from-trash"
            tooltipMessage={message ?? messages.restore}
        />
    );
};
