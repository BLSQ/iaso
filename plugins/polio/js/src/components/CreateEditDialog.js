/* eslint-disable camelcase */
import React, { useEffect, useState } from 'react';

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
} from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { convertEmptyStringToNull } from '../utils/convertEmptyStringToNull';
import { PreparednessForm } from '../forms/PreparednessForm';
import { useFormValidator } from '../hooks/useFormValidator';
import { BaseInfoForm } from '../forms/BaseInfoForm';
import { DetectionForm } from '../forms/DetectionForm';
import { RiskAssessmentForm } from '../forms/RiskAssessmentForm';
import { ScopeForm } from '../forms/ScopeForm';
import { BudgetForm } from '../forms/BudgetForm';
import { Round1Form } from '../forms/Round1Form';
import { Round2Form } from '../forms/Round2Form';
import { Form } from '../forms/Form';
import { useSaveCampaign } from '../hooks/useSaveCampaign';

import { useStyles } from '../styles/theme';
import MESSAGES from '../constants/messages';

const CreateEditDialog = ({ isOpen, onClose, selectedCampaign }) => {
    const { mutate: saveCampaign } = useSaveCampaign();
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
                helpers.setErrors(error);
            },
        });
    };

    const initialValues = {
        round_one: {},
        round_two: {},
        group: {
            name: 'hidden group',
            org_units: [],
        },
        is_preventive: false,
    };

    // Merge inplace default values with the one we get from the campaign.
    merge(initialValues, selectedCampaign);

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
            title: formatMessage(MESSAGES.roundOne),
            form: Round1Form,
        },
        {
            title: formatMessage(MESSAGES.roundTwo),
            form: Round2Form,
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
    return (
        <Dialog
            fullWidth
            maxWidth="lg"
            open={isOpen}
            onClose={(_event, reason) => {
                if (reason === 'backdropClick') {
                    onClose();
                }
            }}
            scroll="body"
            className={classes.mainModal}
        >
            <DialogTitle className={classes.title}>
                {selectedCampaign?.id
                    ? formatMessage(MESSAGES.editCampaign)
                    : formatMessage(MESSAGES.createCampaign)}
            </DialogTitle>
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
                            {formik.errors.non_field_errors?.map(
                                (error_msg, i) => (
                                    <Typography key={i} color="error">
                                        {error_msg}
                                    </Typography>
                                ),
                            )}
                        </Grid>
                    </Grid>
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
                    disabled={!formik.isValid || formik.isSubmitting}
                >
                    {formatMessage(MESSAGES.confirm)}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
// There's naming conflict with component in Iaso
export { CreateEditDialog as PolioCreateEditDialog };
