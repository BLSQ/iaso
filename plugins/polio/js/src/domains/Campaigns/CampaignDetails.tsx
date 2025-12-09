import React, { FunctionComponent } from 'react';
import { PolioDialogTabs } from './MainDialog/PolioDialogTabs';
import { FormikProvider } from 'formik';
import { useCampaignFormState } from './hooks/useCampaignFormState';
import { useCampaignTabs } from './hooks/useCampaignTabs';
import { Form } from '../../components/Form';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { LoadingSpinner, useGoBack, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../constants/messages';
import { WarningModal } from './MainDialog/WarningModal/WarningModal';
import { CampaignHistoryIconButton } from './CampaignHistory/CampaignHistoryIconButton';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { Button } from '@mui/material';

export const CampaignDetails: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.campaignDetails);
    const { campaignId } = params;
    const { formatMessage } = useSafeIntl();
    const goBack = useGoBack();
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
    } = useCampaignFormState({
        campaignId,
    });

    const { tabs, ActiveForm, handleChangeTab, selectedTab } = useCampaignTabs({
        formik,
        selectedCampaign,
    });
    const title = campaignId
        ? formatMessage(MESSAGES.campaignDetail, { obrName: `${campaignId}` })
        : formatMessage(MESSAGES.createCampaign);

    return (
        <>
            <TopBar title={title} displayBackButton goBack={goBack} />
            {(isFetching || isSaving) && <LoadingSpinner absolute />}
            <WarningModal
                title={scopeWarningTitle}
                body={scopeWarningBody}
                open={isScopeWarningOpen}
                closeDialog={closeWarning}
                onConfirm={() => formik.handleSubmit()}
                dataTestId={warningDataTestId}
            />
            <CampaignHistoryIconButton selectedCampaign={selectedCampaign} />
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
            <Button onClick={handleCancel} color="primary" disabled={isSaving}>
                {formatMessage(MESSAGES.cancel)}
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
        </>
    );
};
