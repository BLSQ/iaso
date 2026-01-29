import React, { FunctionComponent } from 'react';
import { MenuItem, SxProps } from '@mui/material';
import { IntlMessage, useSafeIntl } from 'bluesquare-components';
import { defineMessages } from 'react-intl';

const messages = defineMessages({
    delete: {
        id: 'iaso.label.delete',
        defaultMessage: 'Delete',
    },
});

type Props = {
    onClick: () => void;
    message?: IntlMessage;
    sx?: SxProps;
};

export const DeleteMenuItem: FunctionComponent<Props> = ({
    onClick,
    message,
    sx = {},
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <MenuItem onClick={onClick} color="primary" sx={sx}>
            {message ?? formatMessage(messages.delete)}
        </MenuItem>
    );
};
