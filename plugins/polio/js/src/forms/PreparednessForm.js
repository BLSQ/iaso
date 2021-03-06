import { Button, CircularProgress, Grid, Typography } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import { TextInput } from '../components/Inputs';
import { useStyles } from '../styles/theme';
import {
    useGetPreparednessData,
    useSurgeData,
} from '../hooks/useGetPreparednessData';
import { useMemo, useState } from 'react';

export const PreparednessForm = () => {
    const classes = useStyles();
    const [preparednessDataTotals, setPreparednessDataTotals] = useState();
    const [surgeDataTotals, setSurgeDataTotals] = useState();
    const { values, setFieldValue } = useFormikContext();
    const { last_preparedness: lastPreparedness, last_surge: lastSurge } =
        values;
    const totalSummary = useMemo(
        () => preparednessDataTotals || lastPreparedness,
        [preparednessDataTotals, lastPreparedness],
    );
    const surgeSummary = useMemo(
        () => surgeDataTotals || lastSurge,
        [surgeDataTotals, lastSurge],
    );
    const { mutate, isLoading, isError, error } = useGetPreparednessData();

    const refreshData = () => {
        mutate(values.preperadness_spreadsheet_url, {
            onSuccess: data => {
                const { totals, ...payload } = data;

                setPreparednessDataTotals(totals);
                const { national_score, regional_score, district_score } =
                    totals;
                setFieldValue('preparedness_data', {
                    spreadsheet_url: values.preperadness_spreadsheet_url,
                    national_score,
                    district_score,
                    regional_score,
                    payload,
                });
            },
        });
    };

    const isProcessingData = ['QUEUED', 'ONGOING'].includes(
        values.preperadness_sync_status,
    );

    const {
        mutate: surgeMutate,
        isLoading: surgeIsLoading,
        isError: surgeIsError,
        error: surgeError,
    } = useSurgeData();
    const refreshSurgeData = () => {
        surgeMutate(
            {
                google_sheet_url: values.surge_spreadsheet_url,
                surge_country_name: values.country_name_in_surge_spreadsheet,
            },
            {
                onSuccess: counters => {
                    setSurgeDataTotals(counters);
                    const {
                        unicef_completed_recruitment,
                        unicef_recruitment,
                        who_completed_recruitment,
                        who_recruitment,
                    } = counters;
                    setFieldValue('surge_data', {
                        spreadsheet_url: values.surge_spreadsheet_url,
                        unicef_completed_recruitment,
                        unicef_recruitment,
                        who_completed_recruitment,
                        who_recruitment,
                        payload: counters,
                    });
                    setFieldValue(
                        'country_name_in_surge_spreadsheet',
                        values.surge_country_name,
                    );
                },
            },
        );
    };
    return (
        <>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={8} item>
                        <Field
                            label="Preparedness Google Sheet URL"
                            name={'preperadness_spreadsheet_url'}
                            component={TextInput}
                            disabled={isLoading}
                            className={classes.input}
                        />
                    </Grid>
                    <Grid xs={6} md={2} item>
                        <Button
                            target="_blank"
                            href={values.preperadness_spreadsheet_url}
                            color="primary"
                        >
                            Access data
                        </Button>
                    </Grid>
                    <Grid xs={6} md={2} item>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={isLoading || isProcessingData}
                            onClick={refreshData}
                        >
                            Refresh Preparedness data
                        </Button>
                    </Grid>

                    <Grid xd={12} item>
                        {isLoading ? (
                            <CircularProgress />
                        ) : (
                            <>
                                {isError && (
                                    <Typography color="error">
                                        {error.non_field_errors}
                                    </Typography>
                                )}
                                {totalSummary && (
                                    <>
                                        <Typography>
                                            {`Status: ${values.preperadness_sync_status}`}
                                        </Typography>
                                        <Typography>
                                            {`National: ${totalSummary.national_score}%`}
                                        </Typography>
                                        <Typography>
                                            {`Regional: ${totalSummary.regional_score}%`}
                                        </Typography>
                                        <Typography>
                                            {`District: ${totalSummary.district_score}%`}
                                        </Typography>
                                        <Typography variant="caption">
                                            {`Refreshed at: ${(totalSummary.created_at
                                                ? new Date(
                                                      totalSummary.created_at,
                                                  )
                                                : new Date()
                                            ).toUTCString()}`}
                                        </Typography>
                                    </>
                                )}
                            </>
                        )}
                    </Grid>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={8} item>
                        <Field
                            label="Recruitment Surge Google Sheet URL"
                            name={'surge_spreadsheet_url'}
                            component={TextInput}
                            disabled={isLoading}
                            className={classes.input}
                        />
                        <Field
                            label="Country Name in sheet"
                            name={'country_name_in_surge_spreadsheet'}
                            component={TextInput}
                            disabled={isLoading}
                            className={classes.input}
                        />
                    </Grid>
                    <Grid xs={6} md={2} item>
                        <Button
                            target="_blank"
                            href={values.surge_spreadsheet_url}
                            color="primary"
                        >
                            Access data
                        </Button>
                    </Grid>
                    <Grid xs={6} md={2} item>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={surgeIsLoading}
                            onClick={refreshSurgeData}
                        >
                            Refresh Recruitment Data
                        </Button>
                    </Grid>

                    <Grid xd={12} item>
                        {surgeIsLoading ? (
                            <CircularProgress />
                        ) : (
                            <>
                                {surgeIsError && (
                                    <Typography color="error">
                                        {surgeError.non_field_errors}
                                    </Typography>
                                )}
                                {surgeSummary && (
                                    <>
                                        <Typography>
                                            {`WHO To Recruit: ${surgeSummary.who_recruitment}`}
                                        </Typography>
                                        <Typography>
                                            {`WHO Completed Recruitment: ${surgeSummary.who_recruitment}`}
                                        </Typography>
                                        <Typography>
                                            {`UNICEF To Recruit: ${surgeSummary.unicef_recruitment}`}
                                        </Typography>
                                        <Typography>
                                            {`UNICEF Completed Recruitment: ${surgeSummary.unicef_completed_recruitment}`}
                                        </Typography>
                                        <Typography variant="caption">
                                            {`Refreshed at: ${(surgeSummary.created_at
                                                ? new Date(
                                                      surgeSummary.created_at,
                                                  )
                                                : new Date()
                                            ).toUTCString()}`}
                                        </Typography>
                                    </>
                                )}
                            </>
                        )}
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};
