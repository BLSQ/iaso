/* eslint-disable react/require-default-props */
import React, { FunctionComponent } from 'react';
import { Box, Typography } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { RoundString } from '../../constants/types';
import MESSAGES from '../../constants/messages';
import { totalCaregivers, totalCaregiversInformed } from '../../utils/LqasIm';
import { convertStatToPercent } from '../../pages/LQAS/utils';
import { useConvertedLqasImData } from '../../pages/IM/requests';

type Props = {
    campaign?: string;
    round: RoundString;
};

export const CaregiversTableHeader: FunctionComponent<Props> = ({
    campaign,
    round,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data } = useConvertedLqasImData('lqas');
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
