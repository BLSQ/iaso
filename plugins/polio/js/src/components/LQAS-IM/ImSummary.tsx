/* eslint-disable react/require-default-props */
import { Grid, makeStyles, Paper, Typography } from '@material-ui/core';
import React, { FunctionComponent, useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { RoundString } from '../../constants/types';
import { useConvertedLqasImData } from '../../pages/IM/requests';
import { makeAccordionData } from '../../utils/LqasIm';
import MESSAGES from '../../constants/messages';
import { FAIL_COLOR, OK_COLOR, WARNING_COLOR } from '../../styles/constants';

type Props = {
    campaign?: string;
    round: RoundString;
    type: 'imGlobal' | 'imIHH' | 'imOHH';
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

const getVaccinatedColors = (vaccinated, classes) => {
    if (!vaccinated) return '';
    if (parseFloat(vaccinated) <= 5) return classes.pass;
    if (parseFloat(vaccinated) > 5 && parseFloat(vaccinated) < 11)
        return classes.warning;
    return classes.fail;
};

export const ImSummary: FunctionComponent<Props> = ({
    campaign,
    round,
    type,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { data } = useConvertedLqasImData(type);
    const [childrenChecked, sitesVisited, reportingDistricts, vaccinated] =
        useMemo(() => {
            return makeAccordionData({
                type,
                data,
                round,
                campaign,
            });
        }, [data, type, round, campaign]);
    const colorVaccinated = getVaccinatedColors(vaccinated?.value, classes);
    return (
        <>
            {data && campaign && (
                <Paper elevation={1} className={classes.paper}>
                    <Grid
                        container
                        direction="row"
                        style={{ justifyContent: 'space-evenly' }}
                    >
                        {/* <Grid container item xs={12} sm={6}> */}
                        <Grid item xs={4} sm={3}>
                            <Typography
                                variant="body1"
                                className={classes.centerText}
                            >
                                {formatMessage(MESSAGES[childrenChecked.id])}
                            </Typography>
                            <Typography
                                variant="h6"
                                className={`${classes.centerText} ${classes.boldText}`}
                            >
                                {childrenChecked.value}
                            </Typography>
                        </Grid>
                        <Grid item xs={4} sm={3}>
                            <Typography
                                variant="body1"
                                className={classes.centerText}
                            >
                                {formatMessage(MESSAGES[sitesVisited.id])}
                            </Typography>
                            <Typography
                                variant="h6"
                                className={`${classes.centerText} ${classes.boldText}`}
                            >
                                {sitesVisited.value}
                            </Typography>
                        </Grid>
                        <Grid item xs={4} sm={3}>
                            <Typography
                                variant="body1"
                                className={classes.centerText}
                            >
                                {formatMessage(MESSAGES[reportingDistricts.id])}
                            </Typography>
                            <Typography
                                variant="h6"
                                className={`${classes.centerText} ${classes.boldText}`}
                            >
                                {`${reportingDistricts.value}`}
                            </Typography>
                        </Grid>
                        <Grid item xs={4} sm={3}>
                            <Typography
                                variant="body1"
                                className={classes.centerText}
                            >
                                {formatMessage(MESSAGES[vaccinated.id])}
                            </Typography>
                            <Typography
                                variant="h6"
                                className={`${classes.centerText} ${classes.boldText} ${colorVaccinated}`}
                            >
                                {vaccinated.value}
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}
        </>
    );
};
