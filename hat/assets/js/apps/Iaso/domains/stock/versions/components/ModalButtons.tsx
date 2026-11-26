import React, { FunctionComponent } from 'react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PublishIcon from '@mui/icons-material/Publish';
import Button from '@mui/material/Button/Button';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import { useSafeIntl, IconButton } from 'bluesquare-components';

import MESSAGES from '../../messages';

type Props = {
    onClick: () => void;
    dataTestId?: string;
};

type ApplyRulesButtonProps = Props & {
    disabled?: boolean;
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

export const ApplyStockRulesButton: FunctionComponent<
    ApplyRulesButtonProps
> = ({
    onClick,
    disabled = false,
    dataTestId = 'apply-stock-rules-button',
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Tooltip
            title={
                disabled ? formatMessage(MESSAGES.applyRulesOnlyPublished) : ''
            }
        >
            <span>
                <Button
                    color="primary"
                    data-test={dataTestId}
                    data-testid={dataTestId}
                    disabled={disabled}
                    onClick={onClick}
                    startIcon={<PlayArrowIcon />}
                    variant="contained"
                >
                    {formatMessage(MESSAGES.applyRules)}
                </Button>
            </span>
        </Tooltip>
    );
};
