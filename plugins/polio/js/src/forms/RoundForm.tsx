import React, { FunctionComponent } from 'react';
import { Grid } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import { useSafeIntl } from 'bluesquare-components';
import { useStyles } from '../styles/theme';
import MESSAGES from '../constants/messages';
import { DateInput, TextInput } from '../components/Inputs';
import { Campaign } from '../constants/types';
import { RoundDates } from '../components/Rounds/RoundDates/RoundDates';
import { LqasDistrictsPassed } from '../components/Rounds/LqasDistrictsPassed/LqasDistrictsPassed';

type Props = { roundNumber: number };

export const RoundForm: FunctionComponent<Props> = ({ roundNumber }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const {
        values: { rounds = [] },
        setFieldValue,
    } = useFormikContext<Campaign>();
    const roundIndex = rounds.findIndex(r => r.number === roundNumber);

    return (
        <>
            <Grid container spacing={2}>
                <Grid xs={12} md={6} item>
                    <RoundDates
                        roundNumber={roundNumber}
                        roundIndex={roundIndex}
                        setParentFieldValue={setFieldValue}
                        parentFieldValue={rounds[roundIndex]}
                    />
                    <Field
                        label={formatMessage(MESSAGES.mop_up_started_at)}
                        name={`rounds[${roundIndex}].mop_up_started_at`}
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={formatMessage(MESSAGES.mop_up_ended_at)}
                        name={`rounds[${roundIndex}].mop_up_ended_at`}
                        component={DateInput}
                        fullWidth
                    />

                    <Field
                        label={formatMessage(MESSAGES.im_started_at)}
                        name={`rounds[${roundIndex}].im_started_at`}
                        component={DateInput}
                        fullWidth
                    />

                    <Field
                        label={formatMessage(MESSAGES.im_ended_at)}
                        name={`rounds[${roundIndex}].im_ended_at`}
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={formatMessage(MESSAGES.lqas_started_at)}
                        name={`rounds[${roundIndex}].lqas_started_at`}
                        component={DateInput}
                        fullWidth
                    />

                    <Field
                        label={formatMessage(MESSAGES.lqas_ended_at)}
                        name={`rounds[${roundIndex}].lqas_ended_at`}
                        component={DateInput}
                        fullWidth
                    />
                </Grid>
                <Grid xs={12} md={6} item>
                    <LqasDistrictsPassed
                        lqasDistrictsFailing={
                            rounds?.[roundIndex]?.lqas_district_failing
                        }
                        lqasDistrictsPassing={
                            rounds?.[roundIndex]?.lqas_district_passing
                        }
                    />
                    <Field
                        label={formatMessage(
                            MESSAGES.percentage_covered_target_population,
                        )}
                        name={`rounds[${roundIndex}].percentage_covered_target_population`}
                        component={TextInput}
                        className={classes.input}
                    />
                    <Field
                        label={formatMessage(MESSAGES.main_awareness_problem)}
                        name={`rounds[${roundIndex}].main_awareness_problem`}
                        component={TextInput}
                        className={classes.input}
                    />
                    <Field
                        label={formatMessage(
                            MESSAGES.im_percentage_children_missed_in_household,
                        )}
                        name={`rounds[${roundIndex}].im_percentage_children_missed_in_household`}
                        component={TextInput}
                        className={classes.input}
                    />
                    <Field
                        label={formatMessage(
                            MESSAGES.im_percentage_children_missed_out_household,
                        )}
                        name={`rounds[${roundIndex}].im_percentage_children_missed_out_household`}
                        component={TextInput}
                        className={classes.input}
                    />
                    <Field
                        label={formatMessage(
                            MESSAGES.im_percentage_children_missed_in_plus_out_household,
                        )}
                        name={`rounds[${roundIndex}].im_percentage_children_missed_in_plus_out_household`}
                        component={TextInput}
                        className={classes.input}
                    />
                    <Field
                        label={formatMessage(
                            MESSAGES.awareness_of_campaign_planning,
                        )}
                        name={`rounds[${roundIndex}].awareness_of_campaign_planning`}
                        component={TextInput}
                        className={classes.input}
                    />
                </Grid>
            </Grid>
        </>
    );
};
