import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Button } from '@material-ui/core';
import MESSAGES from '../../../../constants/messages';

type Props = {
    onClick: () => void;
};

export const ReasonsForDelayButton: FunctionComponent<Props> = ({
    onClick,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Button variant="contained" color="primary" onClick={onClick}>
            {formatMessage(MESSAGES.edit)}
        </Button>
    );
};
