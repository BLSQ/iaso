import React, { FunctionComponent, useCallback, useState } from 'react';
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
import { FormikProvider } from 'formik';
import isEqual from 'lodash/isEqual';
import { Form } from '../../../components/Form';
import MESSAGES from '../../../constants/messages';
import { baseUrls } from '../../../constants/urls';
import { useStyles } from '../../../styles/theme';
import { PolioDialogTabs } from './PolioDialogTabs';
import { WarningModal } from './WarningModal/WarningModal';
import { useCampaignFormState } from '../hooks/useCampaignFormState';
import { useCampaignTabs } from '../hooks/useCampaignTabs';

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
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const [isBackdropOpen, setIsBackdropOpen] = useState(false);

    const {
        formik,
        isScopeWarningOpen,
        closeWarning,
        scopeWarningTitle,
        scopeWarningBody,
        warningDataTestId,
        handleConfirm,
        handleClose: handleCloseForm,
        isSaving,
        selectedCampaign,
        isFetching,
        campaignLogs,
        saveDisabled,
    } = useCampaignFormState({
        campaignId,
        enableAPI: isOpen,
    });

    const { tabs, ActiveForm, handleChangeTab, selectedTab } = useCampaignTabs({
        formik,
        selectedCampaign,
    });

    // calling modal specific onClose on top of handleCloseForm
    const handleClose = useCallback(() => {
        handleCloseForm();
        onClose();
    }, [handleCloseForm, onClose]);

    return (
        <Dialog
            maxWidth="xl"
            open={isOpen}
            onClose={(_event, reason) => {
                if (
                    reason === 'backdropClick' &&
                    !isEqual(formik.touched, {})
                ) {
                    setIsBackdropOpen(true);
                } else if (
                    reason === 'backdropClick' &&
                    isEqual(formik.touched, {})
                ) {
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
                closeDialog={closeWarning}
                onConfirm={() => formik.handleSubmit()}
                dataTestId={warningDataTestId}
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
                    handleChange={handleChangeTab}
                />
                <FormikProvider value={formik}>
                    <Form>
                        <ActiveForm />
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
