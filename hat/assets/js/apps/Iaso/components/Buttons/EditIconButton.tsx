import React, { FunctionComponent } from 'react';
import { IconButton, IntlMessage } from 'bluesquare-components';
import { defineMessages } from 'react-intl';
import { SvgIconComponent } from '@mui/icons-material';

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
    overridedIcon?: SvgIconComponent;
};

export const EditIconButton: FunctionComponent<Props> = ({
    onClick,
    message,
    disabled = false,
    overridedIcon,
}) => {
    return (
        <IconButton
            onClick={onClick}
            icon="edit"
            overrideIcon={overridedIcon}
            tooltipMessage={message ?? MESSAGES.edit}
            disabled={disabled}
        />
    );
};
