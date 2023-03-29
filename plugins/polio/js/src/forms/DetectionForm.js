import React, { useCallback } from 'react';
import { Grid, Box, Typography, Divider } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import { useSafeIntl } from 'bluesquare-components';
import { DateInput, ResponsibleField } from '../components/Inputs';
import MESSAGES from '../constants/messages';

export const detectionFormFields = [
    'detection_status',
    'detection_responsible',
    'onset_at',
    'pv_notified_at',
    'cvdpv2_notified_at',
];

export const DetectionForm = () => {
    const { formatMessage } = useSafeIntl();
    const { values, setFieldValue } = useFormikContext();
    const updateOnset = useCallback(
        (fieldName, date) => {
            if (date && !values.cvdpv2_notified_at && !values.pv_notified_at) {
                setFieldValue('detection_status', 'ONGOING');
            }
            if (!date && !values.cvdpv2_notified_at && !values.pv_notified_at) {
                setFieldValue('detection_status', 'PENDING');
            }
        },
        [setFieldValue, values.cvdpv2_notified_at, values.pv_notified_at],
    );
    const updatePVNotification = useCallback(
        (fieldName, date) => {
            if (date && !values.cvdpv2_notified_at) {
                setFieldValue('detection_status', 'ONGOING');
            }
            if (!date && !values.cvdpv2_notified_at && !values.onset_at) {
                setFieldValue('detection_status', 'PENDING');
            }
        },
        [setFieldValue, values.cvdpv2_notified_at, values.onset_at],
    );
    const updateVirusNotification = useCallback(
        (fieldName, date) => {
            if (date) {
                setFieldValue('detection_status', 'FINISHED');
            }
            if (!date && !values.onset_at && !values.pv_notified_at) {
                setFieldValue('detection_status', 'PENDING');
            }
            if (!date && (values.onset_at || values.pv_notified_at)) {
                setFieldValue('detection_status', 'ONGOING');
            }
        },
        [setFieldValue, values.onset_at, values.pv_notified_at],
    );
    return (
        <>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={6} item>
                        <Box mb={2} px={2} py={2}>
                            <Typography variant="button">
                                {`${formatMessage(
                                    MESSAGES.status,
                                )}: ${formatMessage(
                                    MESSAGES[
                                        values.detection_status.toLowerCase()
                                    ],
                                )}`}
                            </Typography>
                        </Box>
                        <Box>
                            <Divider />
                        </Box>
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
                        onChange={updateOnset}
                    />
                    <Field
                        label={formatMessage(MESSAGES.pv2_notification_date)}
                        fullWidth
                        name="pv_notified_at"
                        component={DateInput}
                        onChange={updatePVNotification}
                    />
                    <Field
                        label={formatMessage(MESSAGES.virusNotificationDate)}
                        fullWidth
                        name="cvdpv2_notified_at"
                        component={DateInput}
                        onChange={updateVirusNotification}
                    />
                </Grid>
            </Grid>
        </>
    );
};
