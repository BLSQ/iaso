import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';

import { Button } from '@material-ui/core';

import MESSAGES from '../messages';

type Props = {
    onClick: () => void;
    dataTestId?: string;
};

export const AttachmentModalButton: FunctionComponent<Props> = ({
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
            {formatMessage(MESSAGES.addUpdate)}
        </Button>
    );
};
