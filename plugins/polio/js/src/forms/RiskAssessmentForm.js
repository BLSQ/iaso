import React from 'react';
import { Grid } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import { useSafeIntl } from 'bluesquare-components';
import { useStyles } from '../styles/theme';
import MESSAGES from '../constants/messages';
import {
    DateInput,
    ResponsibleField,
    RABudgetStatusField,
    TextInput,
} from '../components/Inputs';

export const RiskAssessmentForm = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    useFormikContext();

    return (
        <>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={6} item>
                        <Field
                            name="risk_assessment_status"
                            component={RABudgetStatusField}
                        />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <Field
                            name="risk_assessment_responsible"
                            component={ResponsibleField}
                        />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <Field
                            label={formatMessage(MESSAGES.verificationScore)}
                            name="verification_score"
                            component={TextInput}
                            className={classes.input}
                        />
                    </Grid>
                </Grid>
                <Grid item md={6}>
                    <Field
                        label={formatMessage(MESSAGES.fieldInvestigationDate)}
                        name="investigation_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={formatMessage(MESSAGES.threelevelCall)}
                        name="three_level_call_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={formatMessage(MESSAGES.firstDraftSubmission)}
                        name="risk_assessment_first_draft_submitted_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={formatMessage(MESSAGES.rrtOprttApproval)}
                        name="risk_assessment_rrt_oprtt_approval_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={formatMessage(MESSAGES.agNopvGroup)}
                        name="ag_nopv_group_met_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={formatMessage(MESSAGES.dgAuthorization)}
                        name="dg_authorized_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={formatMessage(MESSAGES.targetpopulationRoundOne)}
                        name="round_one.target_population"
                        component={TextInput}
                        className={classes.input}
                    />
                    <Field
                        label={formatMessage(MESSAGES.targetpopulationRoundTwo)}
                        name="round_two.target_population"
                        component={TextInput}
                        className={classes.input}
                    />
                    <Field
                        label={formatMessage(MESSAGES.dosesRequested)}
                        name="doses_requested"
                        component={TextInput}
                        className={classes.input}
                    />
                </Grid>
            </Grid>
        </>
    );
};
