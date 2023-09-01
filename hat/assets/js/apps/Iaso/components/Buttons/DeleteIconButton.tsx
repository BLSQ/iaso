import React, { FunctionComponent } from 'react';
import { IconButton } from 'bluesquare-components';
import { defineMessages } from 'react-intl';
import DeleteIcon from '@material-ui/icons/Delete';

const message = defineMessages({
    delete: {
        id: 'iaso.label.delete',
        defaultMessage: 'Delete',
    },
});

type Props = {
    onClick: () => void;
};

export const DeleteIconButton: FunctionComponent<Props> = ({ onClick }) => {
    return (
        <IconButton
            onClick={onClick}
            overrideIcon={DeleteIcon}
            tooltipMessage={message.delete}
        />
    );
};
