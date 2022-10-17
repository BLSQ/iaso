import React, { FunctionComponent } from 'react';

import {
    // @ts-ignore
    IconButton as IconButtonComponent,
} from 'bluesquare-components';

import MESSAGES from '../messages';

type Props = {
    onClick: () => void;
};
export const TriggerModal: FunctionComponent<Props> = ({ onClick }) => (
    <IconButtonComponent
        size="small"
        onClick={onClick}
        icon="edit"
        tooltipMessage={MESSAGES.changeStatus}
    />
);
