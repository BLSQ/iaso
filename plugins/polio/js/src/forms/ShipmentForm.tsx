/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Grid } from '@material-ui/core';
import { Field } from 'formik';
import MESSAGES from '../constants/messages';
import { useStyles } from '../styles/theme';
import { DateInput, Select, TextInput } from '../components/Inputs';
import { polioVaccines } from '../constants/virus';
import { MultilineText } from '../components/Inputs/MultilineText';

type Props = {
    index: number;
    accessor: string;
};

export const ShipmentForm: FunctionComponent<Props> = ({ index, accessor }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    return (
        <>
            <Grid
                container
                item
                xs={12}
                spacing={2}
                justifyContent="flex-start"
            >
                <Grid item md={3}>
                    <Field
                        label={formatMessage(MESSAGES.vaccine)}
                        name={`${accessor}.shipments[${index}].vaccine_name`}
                        className={classes.input}
                        options={polioVaccines}
                        component={Select}
                    />
                </Grid>
                <Grid item md={3}>
                    <Field
                        label={formatMessage(MESSAGES.poNumbers)}
                        name={`${accessor}.shipments[${index}].po_numbers`}
                        component={TextInput}
                        className={classes.input}
                    />
                </Grid>
                <Grid item md={3}>
                    <Field
                        label={formatMessage(MESSAGES.vialsShipped)}
                        name={`${accessor}.shipments[${index}].vials_received`}
                        component={TextInput}
                        className={classes.input}
                    />
                </Grid>
                <Grid item md={3}>
                    <Field
                        label={formatMessage(MESSAGES.receptionPreAlert)}
                        name={`${accessor}.shipments[${index}].reception_pre_alert`}
                        component={DateInput}
                        className={classes.input}
                    />
                </Grid>
                <Grid item md={3}>
                    <Field
                        label={formatMessage(MESSAGES.estimatedDateOfArrival)}
                        name={`${accessor}.shipments[${index}].estimated_arrival_date`}
                        component={DateInput}
                        className={classes.input}
                    />
                </Grid>
                <Grid item md={3}>
                    <Field
                        label={formatMessage(
                            MESSAGES.receptionVaccineArrivalReport,
                        )}
                        name={`${accessor}.shipments[${index}].date_reception`}
                        component={DateInput}
                        className={classes.input}
                    />
                </Grid>
                <Grid item md={3}>
                    <Field
                        label={formatMessage(MESSAGES.comment)}
                        name={`${accessor}.shipments[${index}].comment`}
                        component={MultilineText}
                        className={classes.input}
                        debounceTime={1000}
                    />
                </Grid>
            </Grid>
        </>
    );
};
