/* eslint-disable react/require-default-props */
import { Box, Divider, Grid, makeStyles, Typography } from '@material-ui/core';
import React, { FunctionComponent, useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { ConvertedLqasImData } from '../../../constants/types';
import { makeAccordionData } from '../shared/LqasIm';
import MESSAGES from '../../../constants/messages';
import { FAIL_COLOR, OK_COLOR } from '../../../styles/constants';

type Props = {
    campaign?: string;
    round: number;
    type: 'imGlobal' | 'imIHH' | 'imOHH';
    data: Record<string, ConvertedLqasImData>;
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
    data,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
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
                                {formatMessage(MESSAGES[childrenChecked.id])}
                            </Typography>
                            <Typography
                                variant="h6"
                                className={`${classes.centerText} ${classes.boldText}`}
                            >
                                {childrenChecked.value}
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
                                {formatMessage(MESSAGES[sitesVisited.id])}
                            </Typography>
                            <Typography
                                variant="h6"
                                className={`${classes.centerText} ${classes.boldText}`}
                            >
                                {sitesVisited.value}
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
                                {formatMessage(MESSAGES[reportingDistricts.id])}
                            </Typography>
                            <Typography
                                variant="h6"
                                className={`${classes.centerText} ${classes.boldText}`}
                            >
                                {`${reportingDistricts.value}`}
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
                </Box>
            )}
        </>
    );
};
