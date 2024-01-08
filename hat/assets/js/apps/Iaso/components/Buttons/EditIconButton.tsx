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
};

export const EditIconButton: FunctionComponent<Props> = ({
    onClick,
    message,
}) => {
    return (
        <IconButton
            onClick={onClick}
            icon="edit"
            tooltipMessage={message ?? MESSAGES.edit}
        />
    );
};
