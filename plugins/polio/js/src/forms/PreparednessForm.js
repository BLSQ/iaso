import { Button, CircularProgress, Grid, Typography } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import { TextInput } from '../components/Inputs';
import { useStyles } from '../styles/theme';
import { useGetPreparednessData } from '../hooks/useGetPreparednessData';
import { useMemo, useState } from 'react';

export const PreparednessForm = () => {
    const classes = useStyles();
    const [preparednessDataTotals, setPreparednessDataTotals] = useState();
    const { values, setFieldValue } = useFormikContext();
    const { last_preparedness: lastPreparedness } = values;
    const totalSummary = useMemo(
        () => preparednessDataTotals || lastPreparedness,
        [preparednessDataTotals, lastPreparedness],
    );
    const { mutate, isLoading, isError, error } = useGetPreparednessData();

    const refreshData = () => {
        mutate(values.preperadness_spreadsheet_url, {
            onSuccess: data => {
                const { totals, ...payload } = data;

                setPreparednessDataTotals(totals);
                const {
                    national_score,
                    regional_score,
                    district_score,
                } = totals;
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

    return (
        <>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={8} item>
                        <Field
                            label="Google Sheet URL"
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
                            disabled={isLoading}
                            onClick={refreshData}
                        >
                            Refresh Data
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
        </>
    );
};
