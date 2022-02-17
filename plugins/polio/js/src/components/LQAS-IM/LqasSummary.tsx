/* eslint-disable react/require-default-props */
import { Box, Typography, Grid, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import React, { FunctionComponent, useMemo } from 'react';
import { ConvertedLqasImData, RoundString } from '../../constants/types';
import { FAIL_COLOR, OK_COLOR } from '../../styles/constants';
import {
    getLqasStatsForRound,
    makeCaregiversRatio,
} from '../../pages/LQAS/utils';
import { convertStatToPercent } from '../../utils/LqasIm';

type Props = {
    campaign?: string;
    round: RoundString;
    data: Record<string, ConvertedLqasImData>;
};

const style = () => ({
    containerGrid: { justifyContent: 'space-evenly' },
    centerText: { textAlign: 'center' },
    boldText: { fontWeight: 'bold' },
    pass: { color: OK_COLOR },
    fail: { color: FAIL_COLOR },
    warning: { color: 'rgb(255,196,53)' },
});

const useStyles = makeStyles(style);

const getRatePassedColors = (ratePassed, classes) => {
    if (!ratePassed) return '';
    if (parseFloat(ratePassed) >= 80) return classes.pass;
    if (parseFloat(ratePassed) >= 50) return classes.warning;
    return classes.fail;
};

export const LqasSummary: FunctionComponent<Props> = ({
    campaign,
    round,
    data,
}) => {
    const classes = useStyles();
    const summary = useMemo(() => {
        // eslint-disable-next-line no-unused-vars
        const [passed, failed, _disqualified] = getLqasStatsForRound(
            data,
            campaign,
            round,
        );
        const evaluated: number = passed.length + failed.length;
        const ratePassed: string = convertStatToPercent(
            passed.length,
            evaluated,
        );
        const caregiversRatio =
            data && campaign && data[campaign]
                ? makeCaregiversRatio(data[campaign][round])
                : '';

        return {
            failed: failed.length,
            passed: passed.length,
            ratePassed,
            caregiversRatio,
        };
    }, [data, campaign, round]);

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
                                Passed
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
                                Failed
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
                                Passed (%)
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
