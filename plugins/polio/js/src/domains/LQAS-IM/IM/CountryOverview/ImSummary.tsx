import React, { FunctionComponent, useMemo } from 'react';
import { Box, Divider, Grid, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import { NumberCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/NumberCell';
import MESSAGES from '../../../../constants/messages';
import { FAIL_COLOR, OK_COLOR } from '../../../../styles/constants';
import { makeAccordionData } from '../../shared/LqasIm';
import { ConvertedLqasImData, IMType } from '../../types';

type Props = {
    campaign?: string;
    round: number | undefined;
    type: IMType;
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

    return data && campaign && data[campaign] ? (
        <Box pt={2} pb={2}>
            <Grid container direction="row" className={classes.containerGrid}>
                <Grid item xs={3} sm={2}>
                    <Typography variant="body1" className={classes.centerText}>
                        {formatMessage(MESSAGES[childrenChecked?.id])}
                    </Typography>
                    <Typography
                        variant="h6"
                        className={`${classes.centerText} ${classes.boldText}`}
                    >
                        <NumberCell
                            value={parseInt(childrenChecked?.value, 10)}
                        />
                    </Typography>
                </Grid>
                <Box mt={-2} mb={-2}>
                    <Divider orientation="vertical" />
                </Box>
                <Grid item xs={3} sm={2}>
                    <Typography variant="body1" className={classes.centerText}>
                        {sitesVisited
                            ? formatMessage(MESSAGES[sitesVisited.id])
                            : textPlaceholder}
                    </Typography>
                    <Typography
                        variant="h6"
                        className={`${classes.centerText} ${classes.boldText}`}
                    >
                        <NumberCell value={parseInt(sitesVisited?.value, 10)} />
                    </Typography>
                </Grid>
                <Box mt={-2} mb={-2}>
                    <Divider orientation="vertical" />
                </Box>
                <Grid item xs={3} sm={2}>
                    <Typography variant="body1" className={classes.centerText}>
                        {reportingDistricts
                            ? formatMessage(MESSAGES[reportingDistricts.id])
                            : textPlaceholder}
                    </Typography>
                    <Typography
                        variant="h6"
                        className={`${classes.centerText} ${classes.boldText}`}
                    >
                        {reportingDistricts && (
                            <NumberCell
                                value={parseInt(
                                    `${reportingDistricts.value}`,
                                    10,
                                )}
                            />
                        )}
                        {!reportingDistricts && <Box>{textPlaceholder}</Box>}
                    </Typography>
                </Grid>
                <Box mt={-2} mb={-2}>
                    <Divider orientation="vertical" />
                </Box>
                <Grid item xs={3} sm={2}>
                    <Typography variant="body1" className={classes.centerText}>
                        {vaccinated
                            ? formatMessage(MESSAGES[vaccinated.id])
                            : textPlaceholder}
                    </Typography>
                    <Typography
                        variant="h6"
                        className={`${classes.centerText} ${classes.boldText} ${colorVaccinated}`}
                    >
                        {vaccinated?.value}
                    </Typography>
                </Grid>
            </Grid>
        </Box>
    ) : null;
};
