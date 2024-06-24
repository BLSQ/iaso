import { AddButton } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { MESSAGES } from '../messages';

type Props = {
    onClick: () => void;
    id?: string;
    dataTestId?: string;
    size?: string;
};

export const AddRunButton: FunctionComponent<Props> = props => {
    return <AddButton {...props} message={MESSAGES.addRun} />;
};
