import React from 'react';
import { Grid } from '@material-ui/core';
import { Field } from 'formik';
import { useSafeIntl } from 'bluesquare-components';
import { DateInput, ResponsibleField, StatusField } from '../components/Inputs';
import MESSAGES from '../constants/messages';

export const DetectionForm = () => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={6} item>
                        <Field
                            name="detection_status"
                            component={StatusField}
                        />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <Field
                            name="detection_responsible"
                            component={ResponsibleField}
                        />
                    </Grid>
                </Grid>
                <Grid item md={6}>
                    <Field
                        label={formatMessage(MESSAGES.dateOfOnset)}
                        fullWidth
                        name="onset_at"
                        component={DateInput}
                    />

                    <Field
                        label={formatMessage(MESSAGES.pv2_notification_date)}
                        fullWidth
                        name="pv_notified_at"
                        component={DateInput}
                    />
                    <Field
                        label={formatMessage(MESSAGES.virusNotificationDate)}
                        fullWidth
                        name="cvdpv2_notified_at"
                        component={DateInput}
                    />
                </Grid>
            </Grid>
        </>
    );
};
