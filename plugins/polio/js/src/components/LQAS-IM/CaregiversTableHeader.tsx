/* eslint-disable react/require-default-props */
import React, { FunctionComponent } from 'react';
import { Box, Typography } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { ConvertedLqasImData, RoundString } from '../../constants/types';
import MESSAGES from '../../constants/messages';
import { totalCaregivers, totalCaregiversInformed } from '../../utils/LqasIm';
import { convertStatToPercent } from '../../pages/LQAS/utils';

type Props = {
    campaign?: string;
    data?: ConvertedLqasImData;
    round: RoundString;
};

export const CaregiversTableHeader: FunctionComponent<Props> = ({
    campaign,
    data,
    round,
}) => {
    const { formatMessage } = useSafeIntl();
    const dataForRound = data && campaign ? data[campaign][round] : [];
    return (
        <Box display="flex" justifyContent="space-between">
            <Typography variant="h6">
                {`${formatMessage(
                    MESSAGES.numberCaregiversInformed,
                )}: ${totalCaregiversInformed(dataForRound)}`}
            </Typography>
            <Typography variant="h6">
                {`${formatMessage(
                    MESSAGES.ratioCaregiversInformed,
                )}: ${convertStatToPercent(
                    totalCaregiversInformed(dataForRound),
                    totalCaregivers(dataForRound),
                )}`}
            </Typography>
        </Box>
    );
};
