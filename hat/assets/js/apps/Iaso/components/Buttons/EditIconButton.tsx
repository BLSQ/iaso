import React, { FunctionComponent } from 'react';
import { IconButton } from 'bluesquare-components';
import { defineMessages } from 'react-intl';

const message = defineMessages({
    edit: {
        id: 'iaso.label.edit',
        defaultMessage: 'Edit',
    },
});

type Props = {
    onClick: () => void;
};

export const EditIconButton: FunctionComponent<Props> = ({ onClick }) => {
    return (
        <IconButton
            onClick={onClick}
            icon="edit"
            tooltipMessage={message.edit}
        />
    );
};
