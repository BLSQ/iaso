import React, { FunctionComponent } from 'react';
import { AddButton } from 'bluesquare-components';
import { MESSAGES } from '../messages';

type Props = React.ComponentProps<typeof AddButton> & {
    onClick: () => void;
};

export const AddRunButton: FunctionComponent<Props> = props => {
    return <AddButton {...props} message={MESSAGES.addRun} />;
};
