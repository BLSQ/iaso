import React, {
    FunctionComponent,
    useCallback,
    useState,
    useMemo,
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
import {
    BackdropClickModal,
    IconButton,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import { FormikProvider, useFormik } from 'formik';
import { merge } from 'lodash';

import isEqual from 'lodash/isEqual';
import { useQueryClient } from 'react-query';
import { Form } from '../../../components/Form';
import MESSAGES from '../../../constants/messages';
import { CampaignFormValues } from '../../../constants/types';
import { baseUrls } from '../../../constants/urls';
import { useStyles } from '../../../styles/theme';
import { convertEmptyStringToNull } from '../../../utils/convertEmptyStringToNull';
import { useGetCampaignLogs } from '../campaignHistory/hooks/useGetCampaignHistory';
import { useGetCampaign } from '../hooks/api/useGetCampaign';
import { useSaveCampaign } from '../hooks/api/useSaveCampaign';
import { useValidateCampaign } from '../hooks/useValidateCampaign';
import { PolioDialogTabs } from './PolioDialogTabs';
import { usePolioDialogTabs } from './usePolioDialogTabs';
import { WarningModal } from './WarningModal';

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
    const [selectedCampaignId, setSelectedCampaignId] = useState<
        string | undefined
    >(campaignId);
    const queryClient = useQueryClient();
    const { data: selectedCampaign, isFetching } = useGetCampaign(
        isOpen && selectedCampaignId,
    );

    const { data: campaignLogs } = useGetCampaignLogs(
        selectedCampaign?.id,
        isOpen,
    );
    const [isBackdropOpen, setIsBackdropOpen] = useState(false);
    const [isScopeWarningOpen, setIsScopeWarningOpen] = useState(false);
    const [isUpdated, setIsUpdated] = useState(false);
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const validate = useValidateCampaign();

    const initialValues: CampaignFormValues = useMemo(() => {
        const baseValues: CampaignFormValues = {
            subactivity: undefined, // we save subactivities one by one, so no array here
            rounds: [],
            scopes: [],
            group: {
                name: 'hidden group',
                org_units: [],
            },
            campaign_types: [],
            is_preventive: false,
            is_test: false,
            on_hold: false,
            enable_send_weekly_email: true,
            // Those are Polio default values to be set if the types changes to Polio
            has_data_in_budget_tool: false,
            budget_current_state_key: '-',
            detection_status: 'PENDING',
            risk_assessment_status: 'TO_SUBMIT',
            separate_scopes_per_round: false,
            org_unit: undefined,
            non_field_errors: undefined, // TODO find out whether we still use this formik state value or not
        };

        // Merge default values with the campaign data
        return merge({}, baseValues, {
            ...selectedCampaign,
            rounds: selectedCampaign?.rounds
                ? [...selectedCampaign.rounds].sort(
                      (a, b) => a.number - b.number,
                  )
                : [],
        });
    }, [selectedCampaign]);

    const formik = useFormik({
        initialValues,
        enableReinitialize: true,
        validateOnBlur: true,
        validate,
        onSubmit: (values, helpers) => {
            handleSubmit(values, helpers);
        },
    });

    const handleSubmit = useCallback(
        (values, helpers) => {
            saveCampaign(convertEmptyStringToNull(values), {
                onSuccess: result => {
                    setIsUpdated(true);
                    queryClient.setQueryData(
                        ['campaign', selectedCampaignId],
                        values,
                    );
                    if (!selectedCampaignId) {
                        setSelectedCampaignId(result.id);
                    }
                },
                onError: error => {
                    if (error.details) {
                        helpers.setErrors(error.details);
                    }
                },
            });
        },
        [saveCampaign, queryClient, selectedCampaignId],
    );
    const { touched } = formik;
    const handleClose = () => {
        formik.resetForm();
        if (isUpdated) {
            queryClient.invalidateQueries('campaigns');
            queryClient.invalidateQueries('subActivities');
        }
        onClose();
    };

    const handleConfirm = useCallback(() => {
        // If scope type has changed
        if (
            formik.values.separate_scopes_per_round !==
                formik.initialValues.separate_scopes_per_round &&
            formik.values.id
        ) {
            // Open warning modal
            setIsScopeWarningOpen(true);
        } else {
            formik.handleSubmit();
        }
        // All hooks deps present, but ES-lint wants to add formik object, which is too much
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        formik.handleSubmit,
        formik.values.id,
        formik.values.separate_scopes_per_round,
        formik.initialValues.separate_scopes_per_round,
    ]);

    const scopeWarningTitle = formatMessage(MESSAGES.scopeWarningTitle);
    const scopeWarningBody = formatMessage(MESSAGES.scopesWillBeDeleted);
    const tabs = usePolioDialogTabs(formik, selectedCampaign);
    const [selectedTab, setSelectedTab] = useState(0);

    const CurrentForm = tabs[selectedTab].form;
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
            <WarningModal
                title={scopeWarningTitle}
                body={scopeWarningBody}
                open={isScopeWarningOpen}
                closeDialog={() => setIsScopeWarningOpen(false)}
                onConfirm={() => formik.handleSubmit()}
                dataTestId="scopewarning-modal"
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
                                <IconButton
                                    url={`/${baseUrls.campaignHistory}/campaignId/${selectedCampaign?.id}`}
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
                    onClick={handleConfirm}
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
