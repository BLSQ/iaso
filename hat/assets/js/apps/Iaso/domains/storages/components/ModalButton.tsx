import React, { FunctionComponent } from 'react';

import { IconButton } from 'bluesquare-components';

import MESSAGES from '../messages';

type Props = {
    onClick: () => void;
};
export const ModalButton: FunctionComponent<Props> = ({ onClick }) => (
    <IconButton
        size="small"
        onClick={onClick}
        icon="edit"
        tooltipMessage={MESSAGES.changeStatus}
    />
);
