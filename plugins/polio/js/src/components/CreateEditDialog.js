/* eslint-disable camelcase */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
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
    Tab,
    Tabs,
    Typography,
    Box,
} from '@material-ui/core';

import {
    useSafeIntl,
    LoadingSpinner,
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import { convertEmptyStringToNull } from '../utils/convertEmptyStringToNull';
import { PreparednessForm } from '../forms/PreparednessForm';
import { useFormValidator } from '../hooks/useFormValidator';
import { BaseInfoForm } from '../forms/BaseInfoForm';
import { DetectionForm } from '../forms/DetectionForm';
import { RiskAssessmentForm } from '../forms/RiskAssessmentForm';
import { ScopeForm } from '../forms/ScopeForm.tsx';
import { BudgetForm } from '../forms/BudgetForm';
import { Form } from '../forms/Form';
import { RoundsForm } from '../forms/RoundsForm';
import { RoundsEmptyDates } from './Rounds/RoundsEmptyDates.tsx';
import { useSaveCampaign } from '../hooks/useSaveCampaign';

import { CAMPAIGN_HISTORY_URL } from '../constants/routes';

import { useStyles } from '../styles/theme';
import MESSAGES from '../constants/messages';

const CreateEditDialog = ({
    isOpen,
    onClose,
    selectedCampaign,
    isFetching,
}) => {
    const { mutate: saveCampaign } = useSaveCampaign();

    const schema = useFormValidator();
    const { formatMessage } = useSafeIntl();

    const classes = useStyles();

    const handleSubmit = async (values, helpers) => {
        saveCampaign(convertEmptyStringToNull(values), {
            onSuccess: () => {
                // helpers.resetForm();
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
        onSubmit: handleSubmit,
    });

    const tabs = [
        {
            title: formatMessage(MESSAGES.baseInfo),
            form: BaseInfoForm,
        },
        {
            title: formatMessage(MESSAGES.detection),
            form: DetectionForm,
        },
        {
            title: formatMessage(MESSAGES.riskAssessment),
            form: RiskAssessmentForm,
        },
        {
            title: formatMessage(MESSAGES.scope),
            form: ScopeForm,
        },
        {
            title: formatMessage(MESSAGES.budget),
            form: BudgetForm,
        },
        {
            title: formatMessage(MESSAGES.preparedness),
            form: PreparednessForm,
        },
        {
            title: formatMessage(MESSAGES.rounds),
            form: RoundsForm,
        },
    ];

    const [selectedTab, setSelectedTab] = useState(0);

    const handleChange = (_event, newValue) => {
        setSelectedTab(newValue);
    };

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
                if (reason === 'backdropClick') {
                    onClose();
                }
            }}
            scroll="body"
            className={classes.mainModal}
        >
            {isFetching && <LoadingSpinner absolute />}

            <Grid container>
                <Grid item xs={12} md={6}>
                    <DialogTitle className={classes.title}>
                        {selectedCampaign?.id
                            ? formatMessage(MESSAGES.editCampaign)
                            : formatMessage(MESSAGES.createCampaign)}
                    </DialogTitle>
                </Grid>

                {selectedCampaign && (
                    <Grid item xs={12} md={6}>
                        <Box pr={4} className={classes.historyLink}>
                            <IconButtonComponent
                                url={`${CAMPAIGN_HISTORY_URL}/campaignId/${selectedCampaign?.id}`}
                                icon="history"
                                tooltipMessage={MESSAGES.campaignHistory}
                            />
                        </Box>
                    </Grid>
                )}
            </Grid>

            {/* {selectedCampaign && (
                <Box pl={4}>
                    <Typography variant="body1" color="inherit">
                        <Link
                            to={`${CAMPAIGN_HISTORY_URL}/campaignId/${selectedCampaign?.id}`}
                        >
                            {formatMessage(MESSAGES.campaignHistory)}
                        </Link>
                    </Typography>
                </Box>
            )} */}

            <DialogContent className={classes.content}>
                <Tabs
                    value={selectedTab}
                    className={classes.tabs}
                    textColor="primary"
                    onChange={handleChange}
                    aria-label="disabled tabs example"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {tabs.map(({ title }) => {
                        return <Tab key={title} label={title} />;
                    })}
                </Tabs>
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
                    {formik.errors?.rounds && (
                        <RoundsEmptyDates
                            roundErrors={formik.errors.rounds}
                            roundValues={formik.values.rounds}
                        />
                    )}
                </FormikProvider>
            </DialogContent>
            <DialogActions className={classes.action}>
                <Button
                    onClick={onClose}
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
    isFetching: false,
    selectedCampaign: undefined,
};

CreateEditDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    selectedCampaign: PropTypes.object,
    isFetching: PropTypes.bool,
};

// There's naming conflict with component in Iaso
export { CreateEditDialog as PolioCreateEditDialog };
