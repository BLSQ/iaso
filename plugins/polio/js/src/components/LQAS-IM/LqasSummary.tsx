/* eslint-disable react/require-default-props */
import { Paper, Typography, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import React, { FunctionComponent, useMemo } from 'react';
import { RoundString } from '../../constants/types';
import { useConvertedLqasImData } from '../../pages/IM/requests';
import { FAIL_COLOR, OK_COLOR, WARNING_COLOR } from '../../styles/constants';
import {
    convertStatToPercent,
    getLqasStatsForRound,
    makeCaregiversRatio,
} from '../../pages/LQAS/utils';

type Props = {
    campaign?: string;
    round: RoundString;
};

const style = theme => ({
    paper: {
        marginBottom: theme.spacing(1),
        marginTop: theme.spacing(1),
        paddingTop: '5px',
        paddingBottom: '5px',
    },
    containerGrid: { justifyContent: 'space-evenly' },
    centerText: { textAlign: 'center' },
    boldText: { fontWeight: 'bold' },
    pass: { color: OK_COLOR },
    fail: { color: FAIL_COLOR },
    warning: { color: WARNING_COLOR },
});

const useStyles = makeStyles(style);

const getRatePassedColors = (ratePassed, classes) => {
    if (!ratePassed) return '';
    if (parseFloat(ratePassed) > 80) return classes.pass;
    if (parseFloat(ratePassed) >= 50) return classes.warning;
    return classes.fail;
};

export const LqasSummary: FunctionComponent<Props> = ({ campaign, round }) => {
    const classes = useStyles();
    const { data } = useConvertedLqasImData('lqas');
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
            data && campaign ? makeCaregiversRatio(data[campaign][round]) : '';

        return {
            failed: failed.length,
            passed: passed.length,
            ratePassed,
            caregiversRatio,
        };
    }, [data, campaign, round]);

    const ratePassedColor = getRatePassedColors(summary.ratePassed, classes);

    // Leaving the commented code with caregiversRatio, in case client asks for it on Monday as it's in PowerBI
    return (
        <>
            {data && campaign && (
                <Paper elevation={1} className={classes.paper}>
                    <Grid
                        container
                        direction="row"
                        className={classes.containerGrid}
                    >
                        {/* <Grid container item xs={12} sm={6}> */}
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
                        {/* </Grid> */}
                        {/* <Grid container item xs={12} sm={6}> */}
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
                        {/* <Grid item xs={6} sm={3}>
                                <Typography variant="h6">
                                    Caregivers informed
                                </Typography>
                                <Typography variant="body1">
                                    {`${summary.caregiversRatio}`}
                                </Typography>
                            </Grid> */}
                    </Grid>
                    {/* </Grid> */}
                </Paper>
            )}
        </>
    );
};
