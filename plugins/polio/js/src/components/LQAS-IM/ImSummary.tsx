/* eslint-disable react/require-default-props */
import { Grid, Paper, Typography } from '@material-ui/core';
import React, { FunctionComponent, useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { RoundString } from '../../constants/types';
import { useConvertedLqasImData } from '../../pages/IM/requests';
import { makeAccordionData } from '../../utils/LqasIm';
import MESSAGES from '../../constants/messages';

type Props = {
    campaign?: string;
    round: RoundString;
    type: 'imGlobal' | 'imIHH' | 'imOHH';
};

export const ImSummary: FunctionComponent<Props> = ({
    campaign,
    round,
    type,
}) => {
    const { formatMessage } = useSafeIntl();
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
    return (
        <>
            {data && campaign && (
                <Paper
                    elevation={1}
                    style={{
                        marginBottom: '15px',
                        marginTop: '10px',
                        paddingTop: '5px',
                        paddingBottom: '5px',
                    }}
                >
                    <Grid
                        container
                        direction="row"
                        style={{ justifyContent: 'space-evenly' }}
                    >
                        {/* <Grid container item xs={12} sm={6}> */}
                        <Grid item xs={4} sm={3}>
                            <Typography variant="body1">
                                {formatMessage(MESSAGES[childrenChecked.id])}
                            </Typography>
                            <Typography variant="h6">
                                {childrenChecked.value}
                            </Typography>
                        </Grid>
                        <Grid item xs={4} sm={3}>
                            <Typography variant="body1">
                                {formatMessage(MESSAGES[sitesVisited.id])}
                            </Typography>
                            <Typography variant="h6">
                                {sitesVisited.value}
                            </Typography>
                        </Grid>
                        <Grid item xs={4} sm={3}>
                            <Typography variant="body1">
                                {formatMessage(MESSAGES[reportingDistricts.id])}
                            </Typography>
                            <Typography variant="h6">
                                {`${reportingDistricts.value}`}
                            </Typography>
                        </Grid>
                        <Grid item xs={4} sm={3}>
                            <Typography variant="body1">
                                {formatMessage(MESSAGES[vaccinated.id])}
                            </Typography>
                            <Typography variant="h6">
                                {vaccinated.value}
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}
        </>
    );
};
