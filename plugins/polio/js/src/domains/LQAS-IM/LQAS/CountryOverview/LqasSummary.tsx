/* eslint-disable react/require-default-props */
import React, { FunctionComponent, useMemo } from 'react';
import { Box, Typography, Grid, Divider } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';
import { ConvertedLqasImData } from '../../../../constants/types';
import { FAIL_COLOR, OK_COLOR } from '../../../../styles/constants';
import { accessArrayRound, convertStatToPercent } from '../../shared/LqasIm';
import { getLqasStatsForRound, makeCaregiversRatio } from '../utils';

type Props = {
    campaign?: string;
    round: number | undefined;
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
        const [passed, moderate, poor, failed] = getLqasStatsForRound(
            data,
            campaign,
            round,
        );
        const ratePassed: string = scopeCount
            ? convertStatToPercent(passed.length, scopeCount)
            : '--';
        const caregiversRatio =
            data && campaign && data[campaign]
                ? // TODO exclude over and undersampled
                  makeCaregiversRatio(accessArrayRound(data[campaign], round))
                : '';

        return {
            failed: failed.length + moderate.length + poor.length,
            passed: passed.length,
            ratePassed,
            caregiversRatio,
        };
    }, [data, campaign, round, scopeCount]);

    const ratePassedColor = getRatePassedColors(summary.ratePassed, classes);

    return (
        // eslint-disable-next-line react/jsx-no-useless-fragment
        <>
            {data && campaign && data[campaign] && (
                <Box pt={2} pb={2}>
                    <Grid
                        container
                        direction="row"
                        className={classes.containerGrid}
                    >
                        <Grid item xs={3} sm={2}>
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
                        <Grid item xs={3} sm={2}>
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
                        <Grid item xs={3} sm={2}>
                            <Typography
                                variant="body1"
                                className={classes.centerText}
                            >
                                {formatMessage(MESSAGES.districtsInScope)}
                            </Typography>
                            <Typography
                                variant="h6"
                                className={`${classes.centerText} ${classes.boldText}`}
                            >
                                {`${scopeCount}`}
                            </Typography>
                        </Grid>
                        <Box mt={-2} mb={-2}>
                            <Divider orientation="vertical" />
                        </Box>
                        <Grid item xs={3} sm={2}>
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
