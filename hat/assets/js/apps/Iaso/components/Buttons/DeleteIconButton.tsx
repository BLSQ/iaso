import React, { FunctionComponent } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton, IntlMessage } from 'bluesquare-components';
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
    color: string;
};

export const DeleteIconButton: FunctionComponent<Props> = ({
    onClick,
    message,
    color,
}) => {
    return (
        <IconButton
            onClick={onClick}
            overrideIcon={DeleteIcon}
            tooltipMessage={message ?? messages.delete}
            color={color}
        />
    );
};
