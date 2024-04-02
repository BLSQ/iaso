/* eslint-disable react/jsx-props-no-spreading */
import isEqual from 'lodash/isEqual';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';

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
import { useQueryClient } from 'react-query';
import { Form } from '../../../components/Form';
import MESSAGES from '../../../constants/messages';
import { CAMPAIGN_HISTORY_URL } from '../../../constants/routes';
import { useStyles } from '../../../styles/theme';
import { convertEmptyStringToNull } from '../../../utils/convertEmptyStringToNull';
import { useGetCampaignLogs } from '../campaignHistory/hooks/useGetCampaignHistory';
import { useGetCampaign } from '../hooks/api/useGetCampaign';
import { useSaveCampaign } from '../hooks/api/useSaveCampaign';
import { useValidateCampaign } from '../hooks/useValidateCampaign';
import { PolioDialogTabs } from './PolioDialogTabs';
import { usePolioDialogTabs } from './usePolioDialogTabs';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    campaignId?: string;
};

const CreateEditDialog: FunctionComponent<Props> = ({
    isOpen,
    onClose,
    campaignId,
}) => {
    const { mutate: saveCampaign, isLoading: isSaving } = useSaveCampaign();
    const queryClient = useQueryClient();
    const { data: selectedCampaign, isFetching } = useGetCampaign(
        isOpen && campaignId,
    );

    const { data: campaignLogs } = useGetCampaignLogs(
        selectedCampaign?.id,
        isOpen,
    );
    const [isBackdropOpen, setIsBackdropOpen] = useState(false);
    const [isUpdated, setIsUpdated] = useState(false);
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const validate = useValidateCampaign();

    const handleSubmit = useCallback(
        (values, helpers) => {
            saveCampaign(convertEmptyStringToNull(values), {
                onSuccess: () => {
                    setIsUpdated(true);
                },
                onError: error => {
                    if (error.details) {
                        helpers.setErrors(error.details);
                    }
                },
            });
        },
        [saveCampaign],
    );

    const initialValues = {
        rounds: [],
        scopes: [],
        group: {
            name: 'hidden group',
            org_units: [],
        },
        campaign_types: [],
        is_preventive: false,
        is_test: false,
        enable_send_weekly_email: true,
        // Those are Polio default values to be set if the types changes to Polio
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
        validate,
        onSubmit: (values, helpers) => {
            handleSubmit(values, helpers);
        },
    });
    const { touched } = formik;
    const handleClose = () => {
        formik.resetForm();
        if (isUpdated) {
            queryClient.invalidateQueries('campaigns');
        }
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
        isSaving ||
        isFetching;
    return (
        <Dialog
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
                <Grid container spacing={0}>
                    <Grid item xs={12} md={8}>
                        <Box
                            pr={4}
                            justifyContent="center"
                            alignContent="center"
                        >
                            <DialogTitle sx={{ pb: 0 }}>
                                {selectedCampaign?.id
                                    ? formatMessage(MESSAGES.editCampaign)
                                    : formatMessage(MESSAGES.createCampaign)}
                            </DialogTitle>
                        </Box>
                    </Grid>

                    {selectedCampaign && Boolean(campaignLogs?.length) && (
                        <Grid
                            item
                            xs={12}
                            md={4}
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

            <DialogContent className={classes.content} sx={{ pt: 0, mt: -2 }}>
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
                    disabled={isSaving}
                >
                    {formatMessage(MESSAGES.close)}
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
