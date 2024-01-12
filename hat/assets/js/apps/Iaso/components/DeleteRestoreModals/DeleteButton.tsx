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
};

export const DeleteButton: FunctionComponent<Props> = ({
    onClick,
    message,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Button onClick={onClick} variant="contained" color="primary">
            {message ?? formatMessage(messages.delete)}
        </Button>
    );
};
