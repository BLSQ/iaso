import React, { FunctionComponent } from 'react';
import { IntlMessage, useSafeIntl } from 'bluesquare-components';
import { defineMessages } from 'react-intl';
import { Button } from '@material-ui/core';

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

export const RestoreButton: FunctionComponent<Props> = ({
    onClick,
    message,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Button onClick={onClick} variant="contained" color="primary">
            {message ?? formatMessage(messages.restore)}
        </Button>
    );
};
