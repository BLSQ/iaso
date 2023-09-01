/* eslint-disable react/require-default-props */
import { Box, Typography, Grid, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import React, { FunctionComponent, useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { ConvertedLqasImData } from '../../constants/types';

import { FAIL_COLOR, OK_COLOR } from '../../styles/constants';
import {
    getLqasStatsForRound,
    makeCaregiversRatio,
} from '../../pages/LQAS/utils';
import { accessArrayRound, convertStatToPercent } from '../../utils/LqasIm';
import MESSAGES from '../../constants/messages';

type Props = {
    campaign?: string;
    round: number;
    data: Record<string, ConvertedLqasImData>;
    scopeCount: number;
};

const style = {
    containerGrid: { justifyContent: 'space-evenly' },
    centerText: { textAlign: 'center' },
    boldText: { fontWeight: 'bold' },
    pass: { color: OK_COLOR },
    fail: { color: FAIL_COLOR },
    warning: { color: 'rgb(255,196,53)' },
};

// @ts-ignore
const useStyles = makeStyles(style);

const getRatePassedColors = (ratePassed, classes) => {
    if (!ratePassed || Number.isNaN(parseInt(ratePassed, 10))) return '';
    if (parseFloat(ratePassed) >= 80) return classes.pass;
    return classes.fail;
};

export const LqasSummary: FunctionComponent<Props> = ({
    campaign,
    round,
    data,
    scopeCount,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const summary = useMemo(() => {
        const [passed, failed] = getLqasStatsForRound(data, campaign, round);
        const ratePassed: string = scopeCount
            ? convertStatToPercent(passed.length, scopeCount)
            : '--';
        const caregiversRatio =
            data && campaign && data[campaign]
                ? makeCaregiversRatio(accessArrayRound(data[campaign], round))
                : '';

        return {
            failed: failed.length,
            passed: passed.length,
            ratePassed,
            caregiversRatio,
        };
    }, [data, campaign, round, scopeCount]);

    const ratePassedColor = getRatePassedColors(summary.ratePassed, classes);

    return (
        <>
            {data && campaign && data[campaign] && (
                <Box pt={2} pb={2}>
                    <Grid
                        container
                        direction="row"
                        className={classes.containerGrid}
                    >
                        <Grid item xs={4} sm={3}>
                            <Typography
                                variant="body1"
                                className={classes.centerText}
                            >
                                {formatMessage(MESSAGES.passing)}
                            </Typography>
                            <Typography
                                variant="h6"
                                className={`${classes.centerText} ${classes.boldText}`}
                            >
                                {`${summary.passed}`}
                            </Typography>
                        </Grid>
                        <Box mt={-2} mb={-2}>
                            <Divider orientation="vertical" />
                        </Box>
                        <Grid item xs={4} sm={3}>
                            <Typography
                                variant="body1"
                                className={classes.centerText}
                            >
                                {formatMessage(MESSAGES.failing)}
                            </Typography>
                            <Typography
                                variant="h6"
                                className={`${classes.centerText} ${classes.boldText}`}
                            >
                                {`${summary.failed}`}
                            </Typography>
                        </Grid>
                        <Box mt={-2} mb={-2}>
                            <Divider orientation="vertical" />
                        </Box>
                        <Grid item xs={4} sm={3}>
                            <Typography
                                variant="body1"
                                className={classes.centerText}
                            >
                                {`${formatMessage(MESSAGES.passing)} (%)`}
                            </Typography>
                            <Typography
                                variant="h6"
                                className={`${classes.centerText} ${classes.boldText} ${ratePassedColor}`}
                            >
                                {`${summary.ratePassed}`}
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            )}
        </>
    );
};
