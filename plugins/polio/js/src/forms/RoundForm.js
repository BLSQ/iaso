import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import { useSafeIntl } from 'bluesquare-components';
import { useStyles } from '../styles/theme';
import MESSAGES from '../constants/messages';
import { DateInput, TextInput } from '../components/Inputs';

export const RoundForm = ({ roundNumber }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const {
        values: { rounds = [] },
    } = useFormikContext();
    const roundIndex = rounds.findIndex(r => r.number === roundNumber);
    return (
        <Grid container spacing={2}>
            <Grid xs={12} md={6} item>
                <Field
                    label={formatMessage(MESSAGES.startDate)}
                    name={`rounds[${roundIndex}].started_at`}
                    component={DateInput}
                    required
                    fullWidth
                />

                <Field
                    label={formatMessage(MESSAGES.endDate)}
                    name={`rounds[${roundIndex}].ended_at`}
                    component={DateInput}
                    required
                    fullWidth
                />
                <Field
                    label={formatMessage(MESSAGES.mopUpStart)}
                    name={`rounds[${roundIndex}].mop_up_started_at`}
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label={formatMessage(MESSAGES.mopUpEnd)}
                    name={`rounds[${roundIndex}].mop_up_ended_at`}
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label={formatMessage(MESSAGES.imStart)}
                    name={`rounds[${roundIndex}].im_started_at`}
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label={formatMessage(MESSAGES.imEnd)}
                    name={`rounds[${roundIndex}].im_ended_at`}
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label={formatMessage(MESSAGES.lqasStart)}
                    name={`rounds[${roundIndex}].lqas_started_at`}
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label={formatMessage(MESSAGES.lqasEnd)}
                    name={`rounds[${roundIndex}].lqas_ended_at`}
                    component={DateInput}
                    fullWidth
                />
            </Grid>
            <Grid xs={12} md={6} item>
                <Field
                    label={formatMessage(MESSAGES.districtsPassingLqas)}
                    name={`rounds[${roundIndex}].lqas_district_passing`}
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label={formatMessage(MESSAGES.districtsFailingLqas)}
                    name={`rounds[${roundIndex}].lqas_district_failing`}
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label={formatMessage(MESSAGES.mainReasonForNonVaccination)}
                    name={`rounds[${roundIndex}].main_awareness_problem`}
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label={formatMessage(
                        MESSAGES.ratioChildrenMissedInHousehold,
                    )}
                    name={`rounds[${roundIndex}].im_percentage_children_missed_in_household`}
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label={formatMessage(
                        MESSAGES.ratioChildrenMissedOutOfHousehold,
                    )}
                    name={`rounds[${roundIndex}].im_percentage_children_missed_out_household`}
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label={formatMessage(
                        MESSAGES.ratioChildrenMissedInAndOutOfHousehold,
                    )}
                    name={`rounds[${roundIndex}].im_percentage_children_missed_in_plus_out_household`}
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label={formatMessage(MESSAGES.awarenessCampaignPlanning)}
                    name={`rounds[${roundIndex}].awareness_of_campaign_planning`}
                    component={TextInput}
                    className={classes.input}
                />
            </Grid>
        </Grid>
    );
};

RoundForm.propTypes = {
    roundNumber: PropTypes.number.isRequired,
};
