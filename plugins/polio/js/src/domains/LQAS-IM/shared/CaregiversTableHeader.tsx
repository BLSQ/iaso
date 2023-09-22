/* eslint-disable react/require-default-props */
import React, { FunctionComponent } from 'react';
import { Box, Typography, Paper, makeStyles } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { ConvertedLqasImData } from '../../../constants/types';
import MESSAGES from '../../../constants/messages';
import {
    accessArrayRound,
    convertStatToPercent,
    totalCaregivers,
    totalCaregiversInformed,
} from './LqasIm';

type Props = {
    campaign?: string;
    round: number;
    data: Record<string, ConvertedLqasImData>;
    paperElevation: number;
};

const useStyles = makeStyles(() => ({
    paper: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
}));

export const CaregiversTableHeader: FunctionComponent<Props> = ({
    campaign,
    round,
    data,
    paperElevation,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const dataForRound =
        data && campaign && data[campaign]
            ? accessArrayRound(data[campaign], round)
            : [];
    return (
        <Paper elevation={paperElevation} className={classes.paper}>
            <Box p={2} display="flex" justifyContent="space-between">
                <Typography variant="h6">
                    {`${formatMessage(
                        MESSAGES.totalCaregiversSurveyed,
                    )}: ${totalCaregivers(dataForRound)}`}
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
        </Paper>
    );
};
