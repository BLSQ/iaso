import { Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Field, useFormikContext } from 'formik';
import React, { FunctionComponent } from 'react';
import { DateInput, NumberInput, TextInput } from '../../../components/Inputs';
import MESSAGES from '../../../constants/messages';
import { Campaign } from '../../../constants/types';
import { LqasDistrictsPassed } from './LqasDistrictsPassed/LqasDistrictsPassed';

type Props = { roundNumber: number };

export const EvaluationForm: FunctionComponent<Props> = ({ roundNumber }) => {
    const { formatMessage } = useSafeIntl();
    const {
        values: { rounds = [] },
    } = useFormikContext<Campaign>();
    const roundIndex = rounds.findIndex(r => r.number === roundNumber);

    return (
        <>
            <Grid container spacing={2}>
                <Grid xs={12} md={6} item>
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
                    <Field
                        label={formatMessage(MESSAGES.main_awareness_problem)}
                        name={`rounds[${roundIndex}].main_awareness_problem`}
                        component={TextInput}
                        shrinkLabel={false}
                    />
                    <Field
                        label={formatMessage(
                            MESSAGES.awareness_of_campaign_planning,
                        )}
                        name={`rounds[${roundIndex}].awareness_of_campaign_planning`}
                        component={NumberInput}
                        withMarginTop
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
                            MESSAGES.im_percentage_children_missed_in_household,
                        )}
                        name={`rounds[${roundIndex}].im_percentage_children_missed_in_household`}
                        component={NumberInput}
                        withMarginTop
                    />
                    <Field
                        label={formatMessage(
                            MESSAGES.im_percentage_children_missed_out_household,
                        )}
                        name={`rounds[${roundIndex}].im_percentage_children_missed_out_household`}
                        component={NumberInput}
                        withMarginTop
                    />
                    <Field
                        label={formatMessage(
                            MESSAGES.im_percentage_children_missed_in_plus_out_household,
                        )}
                        name={`rounds[${roundIndex}].im_percentage_children_missed_in_plus_out_household`}
                        component={NumberInput}
                        withMarginTop
                    />
                </Grid>
            </Grid>
        </>
    );
};
