import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useRef,
} from 'react';
import { Box, Button, Grid } from '@mui/material';
import {
    LoadingSpinner,
    useGoBack,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import { FormikProvider } from 'formik';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { Form } from '../../components/Form';
import MESSAGES from '../../constants/messages';
import { Campaign } from '../../constants/types';
import { baseUrls } from '../../constants/urls';
import { useStyles } from '../../styles/theme';
import { CampaignHistoryIconButton } from './CampaignHistory/CampaignHistoryIconButton';
import { useCampaignFormState } from './hooks/useCampaignFormState';
import { useCampaignTabs } from './hooks/useCampaignTabs';
import { PolioDialogTabs } from './MainDialog/PolioDialogTabs';
import { WarningModal } from './MainDialog/WarningModal/WarningModal';

const useTitle = (
    campaignId: string | undefined,
    showObrInTitle: boolean,
    selectedCampaign?: Campaign,
): string => {
    const { formatMessage } = useSafeIntl();
    if (selectedCampaign && showObrInTitle) {
        return formatMessage(MESSAGES.campaignDetail, {
            obrName: `${selectedCampaign.obr_name}`,
        });
    } else if (campaignId) {
        return formatMessage(MESSAGES.campaignDetail, {
            obrName: `${campaignId}`,
        });
    }
    return formatMessage(MESSAGES.createCampaign);
};

export const CampaignDetails: FunctionComponent = () => {
    const classes: Record<string, string> = useStyles();
    const params = useParamsObject(baseUrls.campaignDetails);
    const { campaignId } = params;
    const campaignIdRef = useRef(campaignId);
    const { formatMessage } = useSafeIntl();
    const goBack = useGoBack();
    const redirectToReplace = useRedirectToReplace();
    const {
        formik,
        isScopeWarningOpen,
        closeWarning,
        scopeWarningTitle,
        scopeWarningBody,
        warningDataTestId,
        handleConfirm,
        handleClose: handleCancel,
        isSaving,
        selectedCampaign,
        isFetching,
        saveDisabled,
        showObrInTitle,
    } = useCampaignFormState({
        campaignId,
    });

    const { tabs, ActiveForm, handleChangeTab, selectedTab } = useCampaignTabs({
        formik,
        selectedCampaign,
    });
    const title = useTitle(campaignId, showObrInTitle, selectedCampaign);

    const goBackAndResetForm = useCallback(() => {
        handleCancel();
        goBack();
    }, [goBack, handleCancel]);

    // force refresh on redirection from integrated campaign
    useEffect(() => {
        if (campaignIdRef.current !== campaignId) {
            campaignIdRef.current = campaignId;
            redirectToReplace(
                `${baseUrls.campaignDetails}/campaignId/${campaignId}`,
            );
        }
    }, [redirectToReplace, campaignId]);
    return (
        <>
            <TopBar
                title={title}
                displayBackButton
                goBack={goBackAndResetForm}
            />
            {(isFetching || isSaving) && <LoadingSpinner absolute />}
            <WarningModal
                title={scopeWarningTitle}
                body={scopeWarningBody}
                open={isScopeWarningOpen}
                closeDialog={closeWarning}
                onConfirm={() => formik.handleSubmit()}
                dataTestId={warningDataTestId}
            />
            <Box className={classes.containerFullHeightPadded}>
                <CampaignHistoryIconButton
                    selectedCampaign={selectedCampaign}
                />
                <PolioDialogTabs
                    tabs={tabs}
                    selectedTab={selectedTab}
                    handleChange={handleChangeTab}
                />
                <FormikProvider value={formik}>
                    <Form isModal={false}>
                        <ActiveForm />
                    </Form>
                </FormikProvider>
                <Grid container spacing={2} justifyContent="flex-end" mt={2}>
                    <Box mr={2}>
                        <Button
                            onClick={handleCancel}
                            color="primary"
                            disabled={isSaving}
                        >
                            {formatMessage(MESSAGES.cancel)}
                        </Button>
                    </Box>
                    <Button
                        onClick={handleConfirm}
                        color="primary"
                        variant="contained"
                        autoFocus
                        disabled={saveDisabled}
                    >
                        {formatMessage(MESSAGES.save)}
                    </Button>
                </Grid>
            </Box>
        </>
    );
};
