/* eslint-disable camelcase */
import React from 'react';
import moment from 'moment';
import { defineMessage } from 'react-intl';
import { useFormikContext } from 'formik';
import { Button, Grid, Typography, Tooltip } from '@material-ui/core';
import { LoadingSpinner } from 'bluesquare-components';
import { postRequest } from 'iaso/libs/Api';
import { useSnackMutation } from 'iaso/libs/apiHooks';

export const SendEmailButton = () => {
    const mutation = useSnackMutation(
        campaignId =>
            postRequest(
                `/api/polio/campaigns/${campaignId}/send_notification_email/`,
            ),
        defineMessage({
            id: 'iaso.polio.sendEmail.success',
            defaultMessage: 'Notification Email sent',
        }),
        defineMessage({
            id: 'iaso.polio.sendEmail.error',
            defaultMessage: 'Error sending notification email',
        }),
    );
    const form = useFormikContext();
    const { values } = form;
    const msg = 'Send an e-mail to notify people of the campaign';

    let validation_error = null;
    if (values.creation_email_send_at) {
        validation_error = `Email already sent on ${moment(
            values.creation_email_send_at,
        ).format('LTS')}`;
    } else if (!values.obr_name) {
        validation_error = 'Enter a name';
    } else if (!values.virus) {
        validation_error = 'Enter Virus information';
    } else if (!values.initial_org_unit) {
        validation_error = 'Enter Initial district';
    } else if (!values.onset_at) {
        validation_error = 'Enter Onset Date';
    } else if (form.dirty || !values.id) {
        validation_error = 'Please save the modifications on the campaign';
    }

    return (
        <Grid container item>
            <Tooltip title={validation_error ?? msg}>
                {/* Span is necessary because otherwise tooltip won't show
                 when button is disabled */}
                <span>
                    <Button
                        color="primary"
                        disabled={Boolean(validation_error)}
                        onClick={async () => mutation.mutate(values.id)}
                    >
                        {mutation.isLoading && <LoadingSpinner absolute />}
                        Notify coordinators by e-mail
                    </Button>
                    {mutation?.error?.details?.map((error_msg, i) => (
                        <Typography key={i} color="error">
                            {error_msg}
                        </Typography>
                    ))}
                </span>
            </Tooltip>
        </Grid>
    );
};
