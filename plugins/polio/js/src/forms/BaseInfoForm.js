/* eslint-disable camelcase */
import React, { useMemo } from 'react';
import { Grid, Typography } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import { useSafeIntl } from 'bluesquare-components';
import { useStyles } from '../styles/theme';
import { SendEmailButton } from '../components/Buttons/SendEmailButton';
import { polioVacines, polioViruses } from '../constants/virus';
import { OrgUnitsLevels } from '../components/Inputs/OrgUnitsSelect';
import {
    BooleanInput,
    DateInput,
    Select,
    TextInput,
} from '../components/Inputs';
import MESSAGES from '../constants/messages';
import { EmailListForCountry } from '../components/EmailListForCountry/EmailListForCountry';
import { useGetGroupedCampaigns } from '../hooks/useGetGroupedCampaigns.ts';

export const BaseInfoForm = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data: groupedCampaigns } = useGetGroupedCampaigns();
    const groupedCampaignsOptions = useMemo(
        () =>
            groupedCampaigns?.results.map(result => ({
                label: result.name,
                value: result.id,
            })) ?? [],
        [groupedCampaigns],
    );

    const { values } = useFormikContext();
    const { top_level_org_unit_id } = values;

    return (
        <>
            <Grid container spacing={2}>
                <Grid xs={12} item>
                    <Typography>
                        {formatMessage(MESSAGES.baseInfoFormTitle)}
                    </Typography>
                </Grid>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={6} item>
                        <Field
                            label={formatMessage(MESSAGES.epid)}
                            name="epid"
                            component={TextInput}
                            className={classes.input}
                        />

                        <Field
                            label={formatMessage(MESSAGES.obrName)}
                            name="obr_name"
                            component={TextInput}
                            className={classes.input}
                        />
                        <Field
                            label={formatMessage(MESSAGES.groupedCampaigns)}
                            name="grouped_campaigns"
                            options={groupedCampaignsOptions}
                            component={Select}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Field
                            label={formatMessage(MESSAGES.virus)}
                            name="virus"
                            className={classes.input}
                            options={polioViruses}
                            component={Select}
                        />
                        <Field
                            label={formatMessage(MESSAGES.vaccines)}
                            name="vacine"
                            options={polioVacines}
                            component={Select}
                        />
                    </Grid>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Field
                        className={classes.input}
                        label={formatMessage(MESSAGES.description)}
                        name="description"
                        component={TextInput}
                    />
                    <Field
                        className={classes.input}
                        label={formatMessage(MESSAGES.gpeiCoordinator)}
                        name="gpei_coordinator"
                        component={TextInput}
                    />
                    <Field
                        className={classes.input}
                        name="initial_org_unit"
                        label={formatMessage(MESSAGES.selectInitialRegion)}
                        component={OrgUnitsLevels}
                    />
                </Grid>
                <Grid item xs={6} md={6}>
                    <Field
                        className={classes.input}
                        label={formatMessage(MESSAGES.preventive)}
                        name="is_preventive"
                        component={BooleanInput}
                    />
                    <SendEmailButton />
                    <Field
                        className={classes.input}
                        label={formatMessage(MESSAGES.enableSendWeeklyEmail)}
                        name="enable_send_weekly_email"
                        component={BooleanInput}
                    />
                    <EmailListForCountry countryId={top_level_org_unit_id} />
                </Grid>
                <Grid container item spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Field
                            label={formatMessage(MESSAGES.dateOfOnset)}
                            fullWidth
                            name="onset_at"
                            component={DateInput}
                        />
                        <Field
                            label={formatMessage(
                                MESSAGES.virusNotificationDate,
                            )}
                            fullWidth
                            name="cvdpv2_notified_at"
                            component={DateInput}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Field
                            label={formatMessage(MESSAGES.pv2NotificationDate)}
                            fullWidth
                            name="pv_notified_at"
                            component={DateInput}
                        />
                        <Field
                            label={formatMessage(MESSAGES.threelevelCall)}
                            fullWidth
                            name="three_level_call_at"
                            component={DateInput}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};
