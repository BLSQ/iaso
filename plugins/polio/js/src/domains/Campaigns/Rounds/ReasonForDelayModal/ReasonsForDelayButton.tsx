import React, { FunctionComponent } from 'react';
import { Button } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
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
