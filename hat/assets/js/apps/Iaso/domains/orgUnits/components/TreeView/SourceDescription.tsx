import { Box, Typography } from '@mui/material';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { MESSAGES } from './messages';
import { SourceInfos } from './useSourceConfig';

type Props = {
    sourceInfos?: SourceInfos;
};

export const SourceDescription: FunctionComponent<Props> = ({
    sourceInfos,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box display="flex" width="100%">
            <Typography
                fontSize="12px"
                textTransform="lowercase"
                color="primary"
            >
                {formatMessage(MESSAGES.source)}:{' '}
                {sourceInfos?.sourceName || textPlaceholder}
                {' - '}
                {formatMessage(MESSAGES.version)}:{' '}
                {sourceInfos?.versionLabel !== undefined
                    ? sourceInfos.versionLabel
                    : textPlaceholder}
            </Typography>
        </Box>
    );
};
