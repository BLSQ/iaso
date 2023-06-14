import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Button } from '@material-ui/core';
import { MESSAGES } from './messages';

type ButtonProps = { closeDialog: () => void };

export const CloseButton: FunctionComponent<ButtonProps> = ({
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Button onClick={closeDialog} variant="contained" color="primary">
            {formatMessage(MESSAGES.close)}
        </Button>
    );
};
