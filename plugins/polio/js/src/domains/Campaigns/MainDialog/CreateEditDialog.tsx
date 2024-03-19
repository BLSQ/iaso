/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable camelcase */
import isEqual from 'lodash/isEqual';
import React, { FunctionComponent, useEffect, useState } from 'react';

import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
} from '@mui/material';
import { FormikProvider, useFormik } from 'formik';
import { merge } from 'lodash';

import {
    BackdropClickModal,
    IconButton as IconButtonComponent,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import { useDispatch } from 'react-redux';
import { succesfullSnackBar } from '../../../../../../../hat/assets/js/apps/Iaso/constants/snackBars';
import { enqueueSnackbar } from '../../../../../../../hat/assets/js/apps/Iaso/redux/snackBarsReducer';
import { Form } from '../../../components/Form';
import MESSAGES from '../../../constants/messages';
import { CAMPAIGN_HISTORY_URL } from '../../../constants/routes';
import { useFormValidator } from '../../../hooks/useFormValidator';
import { useStyles } from '../../../styles/theme';
import { convertEmptyStringToNull } from '../../../utils/convertEmptyStringToNull';
import { useGetCampaignLogs } from '../campaignHistory/hooks/useGetCampaignHistory';
import { useGetCampaign } from '../hooks/api/useGetCampaign';
import { useSaveCampaign } from '../hooks/api/useSaveCampaign';
import { PolioDialogTabs } from './PolioDialogTabs';
import { usePolioDialogTabs } from './usePolioDialogTabs';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    campaignId?: string;
};

const successSnackBar = msg => succesfullSnackBar(undefined, msg);

const CreateEditDialog: FunctionComponent<Props> = ({
    isOpen,
    onClose,
    campaignId,
}) => {
    const { mutate: saveCampaign, isLoading: isSaving } = useSaveCampaign();
    const { data: selectedCampaign, isFetching } = useGetCampaign(
        isOpen && campaignId,
    );
    const dispatch = useDispatch();

    const { data: campaignLogs } = useGetCampaignLogs(
        selectedCampaign?.id,
        isOpen,
    );
    const [isBackdropOpen, setIsBackdropOpen] = useState(false);
    const schema = useFormValidator();
    const { formatMessage } = useSafeIntl();

    const classes: Record<string, string> = useStyles();

    const handleSubmit = async (values, helpers) => {
        saveCampaign(convertEmptyStringToNull(values), {
            onSuccess: () => {
                helpers.resetForm();
                onClose();
                // dispatching the snackbar here so the form can be reset and `onClose` called
                // before the snackbar triggers a re-render of the whole table
                dispatch(
                    enqueueSnackbar(
                        successSnackBar(MESSAGES.defaultMutationApiSuccess),
                    ),
                );
            },
            onError: error => {
                helpers.setErrors(error.details);
                helpers.setSubmitting(false);
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
        non_field_errors: undefined,
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
    const tabs = usePolioDialogTabs(formik, selectedCampaign);
    const [selectedTab, setSelectedTab] = useState(0);

    const CurrentForm = tabs[selectedTab].form;

    // default to tab 0 when opening
    useEffect(() => {
        setSelectedTab(0);
    }, [isOpen]);

    const isFormChanged = !isEqual(formik.values, formik.initialValues);
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
            {(isFetching || isSaving) && <LoadingSpinner absolute />}
            <BackdropClickModal
                open={isBackdropOpen}
                closeDialog={() => setIsBackdropOpen(false)}
                onConfirm={() => handleClose()}
            />
            <Box pt={1}>
                <Grid container>
                    <Grid item xs={12} md={6}>
                        <Box
                            pr={4}
                            justifyContent="center"
                            alignContent="center"
                        >
                            <DialogTitle className={classes.title}>
                                {selectedCampaign?.id
                                    ? formatMessage(MESSAGES.editCampaign)
                                    : formatMessage(MESSAGES.createCampaign)}
                            </DialogTitle>
                        </Box>
                    </Grid>

                    {selectedCampaign && campaignLogs?.length && (
                        <Grid
                            item
                            xs={12}
                            md={6}
                            className={classes.historyLink}
                        >
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
            </Box>

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
                    onClick={() => formik.handleSubmit()}
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

// There's naming conflict with component in Iaso
export { CreateEditDialog as PolioCreateEditDialog };
