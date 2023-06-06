/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable camelcase */
import React, { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';

import { FormikProvider, useFormik } from 'formik';
import { merge } from 'lodash';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Typography,
    Box,
} from '@material-ui/core';

import {
    useSafeIntl,
    LoadingSpinner,
    IconButton as IconButtonComponent,
    BackdropClickModal,
} from 'bluesquare-components';
import { convertEmptyStringToNull } from '../utils/convertEmptyStringToNull';
import { useFormValidator } from '../hooks/useFormValidator';
import { BaseInfoForm, baseInfoFormFields } from '../forms/BaseInfoForm';
import {
    RiskAssessmentForm,
    riskAssessmentFormFields,
} from '../forms/RiskAssessmentForm';
import { ScopeForm, scopeFormFields } from '../forms/ScopeForm.tsx';
import { BudgetForm, budgetFormFields } from '../forms/BudgetForm.tsx';
import { PreparednessForm } from '../forms/PreparednessForm';
import { Form } from '../forms/Form';
import { RoundsForm, roundFormFields } from '../forms/RoundsForm';
import {
    VaccineManagementForm,
    vaccineManagementFormFields,
} from '../forms/VaccineManagementForm.tsx';

import { useSaveCampaign } from '../hooks/useSaveCampaign';
import { useGetCampaignLogs } from '../hooks/useGetCampaignHistory.ts';

import { CAMPAIGN_HISTORY_URL } from '../constants/routes';

import { useStyles } from '../styles/theme';
import MESSAGES from '../constants/messages';
import { useGetCampaign } from '../hooks/useGetCampaign';
import { compareArraysValues } from '../utils/compareArraysValues.ts';
import { PolioDialogTabs } from './MainDialog/PolioDialogTabs.tsx';

const CreateEditDialog = ({ isOpen, onClose, campaignId }) => {
    const { mutate: saveCampaign } = useSaveCampaign();
    const { data: selectedCampaign, isFetching } = useGetCampaign(
        isOpen && campaignId,
    );

    const { data: campaignLogs } = useGetCampaignLogs(
        selectedCampaign?.id,
        isOpen,
    );
    const [isBackdropOpen, setIsBackdropOpen] = useState(false);
    const schema = useFormValidator();
    const { formatMessage } = useSafeIntl();

    const classes = useStyles();

    const handleSubmit = async (values, helpers) => {
        saveCampaign(convertEmptyStringToNull(values), {
            onSuccess: () => {
                helpers.resetForm();
                onClose();
            },
            onError: error => {
                helpers.setErrors(error.details);
            },
        });
    };

    const initialValues = {
        rounds: [],
        scopes: [],
        group: {
            name: 'hidden group',
            org_units: [],
        },
        is_preventive: false,
        is_test: false,
        enable_send_weekly_email: true,
        has_data_in_budget_tool: false,
        budget_current_state_key: '-',
        detection_status: 'PENDING',
        risk_assessment_status: 'TO_SUBMIT',
    };

    // Merge inplace default values with the one we get from the campaign.
    merge(initialValues, {
        ...selectedCampaign,
        rounds: selectedCampaign?.rounds
            ? [...selectedCampaign.rounds].sort((a, b) => a.number - b.number)
            : [],
    });
    const formik = useFormik({
        initialValues,
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: (values, helpers) => {
            helpers.setSubmitting(true);
            handleSubmit(values, helpers);
        },
    });
    const { touched } = formik;

    const handleClose = () => {
        formik.resetForm();
        onClose();
    };
    const tabs = useMemo(() => {
        return [
            {
                title: formatMessage(MESSAGES.baseInfo),
                form: BaseInfoForm,
                hasTabError: compareArraysValues(
                    baseInfoFormFields,
                    formik.errors,
                ),
                key: 'baseInfo',
            },
            {
                title: formatMessage(MESSAGES.rounds),
                form: RoundsForm,
                key: 'rounds',
                hasTabError: compareArraysValues(
                    roundFormFields(selectedCampaign?.rounds ?? []),
                    formik.errors,
                ),
            },
            {
                title: formatMessage(MESSAGES.riskAssessment),
                form: RiskAssessmentForm,
                hasTabError: compareArraysValues(
                    riskAssessmentFormFields,
                    formik.errors,
                ),
                key: 'riskAssessment',
            },
            {
                title: formatMessage(MESSAGES.scope),
                form: ScopeForm,
                disabled:
                    !formik.values.initial_org_unit ||
                    formik.values.rounds.length === 0,
                hasTabError: compareArraysValues(
                    scopeFormFields,
                    formik.errors,
                ),
                key: 'scope',
            },
            {
                title: formatMessage(MESSAGES.budget),
                form: BudgetForm,
                hasTabError: compareArraysValues(
                    budgetFormFields(selectedCampaign?.rounds ?? []),
                    formik.errors,
                ),
                key: 'budget',
            },
            {
                title: formatMessage(MESSAGES.preparedness),
                form: PreparednessForm,
                key: 'preparedness',
            },
            {
                title: formatMessage(MESSAGES.vaccineManagement),
                form: VaccineManagementForm,
                key: 'vaccineManagement',
                hasTabError: compareArraysValues(
                    vaccineManagementFormFields(selectedCampaign?.rounds ?? []),
                    formik.errors,
                ),
            },
        ];
    }, [
        formatMessage,
        formik.errors,
        formik.values.initial_org_unit,
        formik.values.rounds.length,
        selectedCampaign?.rounds,
    ]);
    const [selectedTab, setSelectedTab] = useState(0);

    const CurrentForm = tabs[selectedTab].form;

    // default to tab 0 when opening
    useEffect(() => {
        setSelectedTab(0);
    }, [isOpen]);

    const [isFormChanged, setIsFormChanged] = useState(false);
    useEffect(() => {
        setIsFormChanged(!isEqual(formik.values, formik.initialValues));
    }, [formik]);
    const saveDisabled =
        !isFormChanged ||
        (isFormChanged && !formik.isValid) ||
        formik.isSubmitting;

    return (
        <Dialog
            fullWidth
            maxWidth="xl"
            open={isOpen}
            onClose={(_event, reason) => {
                if (reason === 'backdropClick' && !isEqual(touched, {})) {
                    setIsBackdropOpen(true);
                } else if (reason === 'backdropClick' && isEqual(touched, {})) {
                    handleClose();
                }
            }}
            scroll="body"
            className={classes.mainModal}
        >
            {isFetching && <LoadingSpinner absolute />}
            <BackdropClickModal
                open={isBackdropOpen}
                closeDialog={() => setIsBackdropOpen(false)}
                onConfirm={() => handleClose()}
            />

            <Grid container>
                <Grid item xs={12} md={6}>
                    <Box pr={4} justifyContent="center" alignContent="center">
                        <DialogTitle className={classes.title}>
                            {selectedCampaign?.id
                                ? formatMessage(MESSAGES.editCampaign)
                                : formatMessage(MESSAGES.createCampaign)}
                        </DialogTitle>
                    </Box>
                </Grid>

                {selectedCampaign && campaignLogs?.length > 0 && (
                    <Grid item xs={12} md={6} className={classes.historyLink}>
                        <Box pr={4} alignItems="center">
                            <IconButtonComponent
                                url={`${CAMPAIGN_HISTORY_URL}/campaignId/${selectedCampaign?.id}`}
                                icon="history"
                                tooltipMessage={MESSAGES.campaignHistory}
                                classes={{
                                    linkButton: classes.linkButton,
                                }}
                            />
                        </Box>
                    </Grid>
                )}
            </Grid>

            <DialogContent className={classes.content}>
                <PolioDialogTabs
                    tabs={tabs}
                    selectedTab={selectedTab}
                    handleChange={(_event, newValue) => {
                        setSelectedTab(newValue);
                    }}
                />
                <FormikProvider value={formik}>
                    <Form>
                        <CurrentForm />
                    </Form>
                    <Grid container justifyContent="flex-end">
                        <Grid item md={6}>
                            {formik.errors?.non_field_errors?.map(
                                (error_msg, i) => (
                                    <Typography key={i} color="error">
                                        {error_msg}
                                    </Typography>
                                ),
                            )}
                        </Grid>
                    </Grid>
                    {/* TO DO / SPECIFIC COMMIT TO REMOVE ERRORS ROUND */}
                    {/* {formik.errors?.rounds && (
                        <RoundsEmptyDates
                            roundErrors={formik.errors.rounds}
                            roundValues={formik.values.rounds}
                        />
                    )} */}
                </FormikProvider>
            </DialogContent>
            <DialogActions className={classes.action}>
                <Button
                    onClick={handleClose}
                    color="primary"
                    disabled={formik.isSubmitting}
                >
                    {formatMessage(MESSAGES.cancel)}
                </Button>
                <Button
                    onClick={formik.handleSubmit}
                    color="primary"
                    variant="contained"
                    autoFocus
                    disabled={saveDisabled}
                >
                    {formatMessage(MESSAGES.confirm)}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

CreateEditDialog.defaultProps = {
    campaignId: undefined,
};

CreateEditDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    campaignId: PropTypes.string,
};

// There's naming conflict with component in Iaso
export { CreateEditDialog as PolioCreateEditDialog };
