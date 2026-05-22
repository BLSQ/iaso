import React, { FunctionComponent } from 'react';
import { Button } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';

type Props = {
    onClick: () => void;
    dataTestId?: string;
};

export const PredefinedFilterModalButton: FunctionComponent<Props> = ({
    onClick,
    dataTestId,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Button
            color="primary"
            data-test={dataTestId}
            onClick={onClick}
            variant="contained"
        >
            {formatMessage(MESSAGES.add)}
        </Button>
    );
};
