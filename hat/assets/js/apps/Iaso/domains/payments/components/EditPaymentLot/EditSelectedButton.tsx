import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Button } from '@mui/material';
import MESSAGES from '../../messages';

type Props = {
    onClick: () => void;
    disabled?: boolean;
};

export const EditSelectedButton: FunctionComponent<Props> = ({
    onClick,
    disabled = false,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Button
            variant="contained"
            color="primary"
            onClick={onClick}
            disabled={disabled}
        >
            {formatMessage(MESSAGES.editSelected)}
        </Button>
    );
};
