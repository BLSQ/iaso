import React from 'react';
import { Grid } from '@material-ui/core';
import { Field } from 'formik';
import { useSafeIntl } from 'bluesquare-components';
import { useStyles } from '../styles/theme';
import MESSAGES from '../constants/messages';
import { DateInput, TextInput } from '../components/Inputs';

export const Round1Form = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();

    return (
        <Grid container spacing={2}>
            <Grid xs={12} md={6} item>
                <Field
                    label={formatMessage(MESSAGES.roundOneStart)}
                    name="round_one.started_at"
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label={formatMessage(MESSAGES.roundOneEnd)}
                    name="round_one.ended_at"
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label={formatMessage(MESSAGES.mopUpStart)}
                    name="round_one.mop_up_started_at"
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label={formatMessage(MESSAGES.mopUpEnd)}
                    name="round_one.mop_up_ended_at"
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label={formatMessage(MESSAGES.imStart)}
                    name="round_one.im_started_at"
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label={formatMessage(MESSAGES.imEnd)}
                    name="round_one.im_ended_at"
                    component={DateInput}
                    fullWidth
                />
            </Grid>
            <Grid xs={12} md={6} item>
                <Field
                    label={formatMessage(MESSAGES.lqasStart)}
                    name="round_one.lqas_started_at"
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label={formatMessage(MESSAGES.lqasEnd)}
                    name="round_one.lqas_ended_at"
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label={formatMessage(MESSAGES.districtsPassingLqas)}
                    name="round_one.lqas_district_passing"
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label={formatMessage(MESSAGES.districtsFailingLqas)}
                    name="round_one.lqas_district_failing"
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label={formatMessage(MESSAGES.mainReasonForNonVaccination)}
                    name="round_one.main_awareness_problem"
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label={formatMessage(
                        MESSAGES.ratioChildrenMissedInHousehold,
                    )}
                    name="round_one.im_percentage_children_missed_in_household"
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label={formatMessage(
                        MESSAGES.ratioChildrenMissedOutOfHousehold,
                    )}
                    name="round_one.im_percentage_children_missed_out_household"
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label={formatMessage(
                        MESSAGES.ratioChildrenMissedInAndOutOfHousehold,
                    )}
                    name="round_one.im_percentage_children_missed_in_plus_out_household"
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label={formatMessage(MESSAGES.awarenessCampaignPlanning)}
                    name="round_one.awareness_of_campaign_planning"
                    component={TextInput}
                    className={classes.input}
                />
            </Grid>
        </Grid>
    );
};
