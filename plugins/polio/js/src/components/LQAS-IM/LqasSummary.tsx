/* eslint-disable react/require-default-props */
import { Paper, Typography, Grid } from '@material-ui/core';
import React, { FunctionComponent, useMemo } from 'react';
import { RoundString } from '../../constants/types';
import { useConvertedLqasImData } from '../../pages/IM/requests';
import {
    convertStatToPercent,
    getLqasStatsForRound,
    makeCaregiversRatio,
} from '../../pages/LQAS/utils';

type Props = {
    campaign?: string;
    round: RoundString;
};

export const LqasSummary: FunctionComponent<Props> = ({ campaign, round }) => {
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
                            <Typography variant="body1">Passed</Typography>
                            <Typography variant="h6">
                                {`${summary.passed}`}
                            </Typography>
                        </Grid>
                        <Grid item xs={4} sm={3}>
                            <Typography variant="body1">Failed</Typography>
                            <Typography variant="h6">
                                {`${summary.failed}`}
                            </Typography>
                        </Grid>
                        {/* </Grid> */}
                        {/* <Grid container item xs={12} sm={6}> */}
                        <Grid item xs={4} sm={3}>
                            <Typography variant="body1">Passed (%)</Typography>
                            <Typography variant="h6">
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
