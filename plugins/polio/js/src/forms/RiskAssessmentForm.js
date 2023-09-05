import React, { useCallback } from 'react';
import { Grid, Box, Typography, Divider } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import { useSafeIntl } from 'bluesquare-components';
import { useStyles } from '../styles/theme';
import MESSAGES from '../constants/messages';
import { DateInput, TextInput, NumberInput } from '../components/Inputs';

export const riskAssessmentFormFields = [
    'risk_assessment_status',
    'verification_score',
    'investigation_at',
    'outbreak_declaration_date',
    'risk_assessment_first_draft_submitted_at',
    'risk_assessment_rrt_oprtt_approval_at',
    // 'ag_nopv_group_met_at',
    // 'dg_authorized_at',
];

export const RiskAssessmentForm = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const { values, setFieldValue } = useFormikContext();
    const { rounds = [] } = values;
    const updateFirstDraftSubmission = useCallback(
        (fieldName, date) => {
            if (date && !values.risk_assessment_rrt_oprtt_approval_at) {
                setFieldValue('risk_assessment_status', 'SUBMITTED');
            }
            if (!date && !values.risk_assessment_rrt_oprtt_approval_at) {
                setFieldValue('risk_assessment_status', 'TO_SUBMIT');
            }
            // if (
            //     date &&
            //     !values.risk_assessment_rrt_oprtt_approval_at &&
            //     !values.dg_authorized_at
            // ) {
            //     setFieldValue('risk_assessment_status', 'SUBMITTED');
            // }
            // if (
            //     !date &&
            //     !values.risk_assessment_rrt_oprtt_approval_at &&
            //     !values.dg_authorized_at
            // ) {
            //     setFieldValue('risk_assessment_status', 'TO_SUBMIT');
            // }
        },
        [
            setFieldValue,
            // values.dg_authorized_at,
            values.risk_assessment_rrt_oprtt_approval_at,
        ],
    );
    const updateRRTApproval = useCallback(
        (fieldName, date) => {
            if (date) {
                setFieldValue('risk_assessment_status', 'APPROVED');
            }

            if (!date && values.risk_assessment_first_draft_submitted_at) {
                setFieldValue('risk_assessment_status', 'SUBMITTED');
            }

            if (!date && !values.risk_assessment_first_draft_submitted_at) {
                setFieldValue('risk_assessment_status', 'TO_SUBMIT');
            }
            // if (date && !values.dg_authorized_at) {
            //     setFieldValue('risk_assessment_status', 'REVIEWED');
            // }
            // if (
            //     !date &&
            //     values.risk_assessment_first_draft_submitted_at &&
            //     !values.dg_authorized_at
            // ) {
            //     setFieldValue('risk_assessment_status', 'SUBMITTED');
            // }
            // if (
            //     !date &&
            //     !values.risk_assessment_first_draft_submitted_at &&
            //     !values.dg_authorized_at
            // ) {
            //     setFieldValue('risk_assessment_status', 'TO_SUBMIT');
            // }
        },
        [
            setFieldValue,
            // values.dg_authorized_at,
            values.risk_assessment_first_draft_submitted_at,
        ],
    );
    // const updateDGAuthorized = useCallback(
    //     (fieldName, date) => {
    //         if (date) {
    //             setFieldValue('risk_assessment_status', 'APPROVED');
    //         }
    //         if (
    //             !date &&
    //             values.risk_assessment_rrt_oprtt_approval_at &&
    //             !values.risk_assessment_first_draft_submitted_at
    //         ) {
    //             setFieldValue('risk_assessment_status', 'REVIEWED');
    //         }
    //         if (
    //             !date &&
    //             !values.risk_assessment_rrt_oprtt_approval_at &&
    //             values.risk_assessment_first_draft_submitted_at
    //         ) {
    //             setFieldValue('risk_assessment_status', 'SUBMITTED');
    //         }
    //         if (
    //             !date &&
    //             !values.risk_assessment_rrt_oprtt_approval_at &&
    //             !values.risk_assessment_first_draft_submitted_at
    //         ) {
    //             setFieldValue('risk_assessment_status', 'TO_SUBMIT');
    //         }
    //     },
    //     [
    //         setFieldValue,
    //         values.risk_assessment_first_draft_submitted_at,
    //         values.risk_assessment_rrt_oprtt_approval_at,
    //     ],
    // );
    const status = values.risk_assessment_status
        ? formatMessage(MESSAGES[values.risk_assessment_status])
        : formatMessage(MESSAGES.TO_SUBMIT);

    return (
        <>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} item>
                        <Box mb={2} px={2}>
                            <Typography variant="button">
                                {`${formatMessage(MESSAGES.status)}: ${status}`}
                            </Typography>
                        </Box>
                        <Box mr={2}>
                            <Divider style={{ width: '50%' }} />
                        </Box>
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
                        label={formatMessage(MESSAGES.outbreakdeclarationdate)}
                        name="outbreak_declaration_date"
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
                        onChange={updateFirstDraftSubmission}
                    />
                    <Field
                        label={formatMessage(MESSAGES.rrtOprttApproval)}
                        name="risk_assessment_rrt_oprtt_approval_at"
                        component={DateInput}
                        fullWidth
                        onChange={updateRRTApproval}
                    />
                    {/* temporary hiding those fields but should not be removed as we will need them at a later sta
                    {/* <Field
                        label={formatMessage(MESSAGES.ag_nopv_group_met_at)}
                        name="ag_nopv_group_met_at"
                        component={DateInput}
                        fullWidth
                    /> */}
                    {/* <Field
                        label={formatMessage(MESSAGES.dgAuthorization)}
                        name="dg_authorized_at"
                        component={DateInput}
                        fullWidth
                        onChange={updateDGAuthorized}
                    /> */}
                    <Box mt={2}>
                        <Field
                            label={formatMessage(MESSAGES.verificationScore)}
                            name="verification_score"
                            component={NumberInput}
                            className={classes.input}
                            min={0}
                            max={20}
                        />
                    </Box>
                </Grid>
                <Grid item md={6}>
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
                </Grid>
            </Grid>
        </>
    );
};
