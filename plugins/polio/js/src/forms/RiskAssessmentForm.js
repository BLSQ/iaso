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
    NumberInput,
} from '../components/Inputs';

export const riskAssessmentFormFields = [
    'risk_assessment_status',
    'risk_assessment_responsible',
    'verification_score',
    'investigation_at',
    'three_level_call_at',
    'risk_assessment_first_draft_submitted_at',
    'risk_assessment_rrt_oprtt_approval_at',
    'ag_nopv_group_met_at',
    'dg_authorized_at',
];

export const RiskAssessmentForm = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const { values } = useFormikContext();
    const { rounds = [] } = values;

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
                            component={NumberInput}
                            className={classes.input}
                            min={0}
                            max={20}
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
                        label={formatMessage(
                            MESSAGES.risk_assessment_first_draft_submitted_at,
                        )}
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
                        label={formatMessage(MESSAGES.ag_nopv_group_met_at)}
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
                </Grid>
                <Grid item md={6}>
                    {rounds.map((round, i) => {
                        return (
                            <Field
                                key={round.number}
                                label={`${formatMessage(
                                    MESSAGES.dosesRequested,
                                )} ${formatMessage(MESSAGES.round)} ${
                                    round.number
                                }`}
                                name={`rounds[${i}].doses_requested`}
                                component={TextInput}
                                className={classes.input}
                            />
                        );
                    })}
                    {rounds.map((round, i) => {
                        return (
                            <Field
                                key={round.number}
                                label={`${formatMessage(
                                    MESSAGES.target_population,
                                )} ${round.number}`}
                                name={`rounds[${i}].target_population`}
                                component={TextInput}
                                className={classes.input}
                            />
                        );
                    })}
                </Grid>
            </Grid>
        </>
    );
};
