import React, { FunctionComponent } from 'react';
import PublishIcon from '@mui/icons-material/Publish';
import { Button } from '@mui/material';
import { useSafeIntl, IconButton } from 'bluesquare-components';

import MESSAGES from '../../messages';

type Props = {
    onClick: () => void;
    dataTestId?: string;
};

export const PublishButton: FunctionComponent<Props> = ({
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
            {formatMessage(MESSAGES.publish)}
        </Button>
    );
};

export const PublishIconButton: FunctionComponent<Props> = ({
    onClick,
    dataTestId,
}) => {
    return (
        <IconButton
            onClick={onClick}
            dataTestId={dataTestId}
            overrideIcon={PublishIcon}
            tooltipMessage={MESSAGES.publish}
            color="inherit"
        />
    );
};
