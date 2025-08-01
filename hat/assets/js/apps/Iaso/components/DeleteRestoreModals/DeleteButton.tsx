import React, { FunctionComponent } from 'react';
import { IntlMessage, useSafeIntl } from 'bluesquare-components';
import { defineMessages } from 'react-intl';
import { Button } from '@mui/material';

const messages = defineMessages({
    delete: {
        id: 'iaso.label.delete',
        defaultMessage: 'Delete',
    },
});

type Props = {
    onClick: () => void;
    message?: IntlMessage;
    variant?: 'text' | 'outlined' | 'contained';
    size?: 'small' | 'medium' | 'large';
    sx?: object;
};

export const DeleteButton: FunctionComponent<Props> = ({
    onClick,
    message,
    variant = 'contained',
    size = 'medium',
    sx = {},
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Button
            onClick={onClick}
            variant={variant}
            color="primary"
            size={size}
            sx={sx}
        >
            {message ?? formatMessage(messages.delete)}
        </Button>
    );
};
