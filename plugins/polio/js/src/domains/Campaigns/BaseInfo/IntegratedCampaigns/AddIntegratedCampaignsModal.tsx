import React, { FunctionComponent, useCallback } from 'react';
import { ConfirmCancelModal, makeFullModal } from 'bluesquare-components';
import { CampaignAsyncSelect } from '../../CampaignsAsyncSelect/CampaignsAsyncSelect';
import { useFormikContext } from 'formik';
import { AddIntegratedCampaignsButton } from './AddIntegratedCampaignsButton';
import MESSAGES from '../../../../constants/messages';
import { PolioCampaignValues } from '../../../../constants/types';
import { Box } from '@mui/material';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
};

const AddIntegratedCampaignsModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
}) => {
    const { values, initialValues, touched, setFieldTouched, setFieldValue } =
        useFormikContext<PolioCampaignValues>();

    const handleConfirm = useCallback(() => {
        setFieldTouched('integrated_campaigns', true);
    }, [setFieldValue, initialValues]);

    const handleCancel = useCallback(() => {
        setFieldTouched('integrated_campaigns', false);
        setFieldValue(
            'integrated_campaigns',
            initialValues.integrated_campaigns,
        );
    }, [setFieldTouched, setFieldValue, initialValues]);

    const handleChange = useCallback(
        (_, value) => {
            setFieldTouched('integrated_campaigns', true);
            setFieldValue('integrated_campaigns', [
                ...values.integrated_campaigns,
                {
                    id: value.value,
                    obr_name: value.label,
                    campaign_types: value.campaign_types,
                },
            ]);
        },
        [setFieldTouched, setFieldValue, values.integrated_campaigns],
    );
    const allowConfirm =
        Boolean(values.integrated_campaigns) &&
        Boolean(touched.integrated_campaigns);
    return (
        <ConfirmCancelModal
            dataTestId="add-integrated-campaigns-modal"
            id="add-integrated-campaigns-modal"
            open={isOpen}
            closeDialog={closeDialog}
            onConfirm={handleConfirm}
            onClose={() => null}
            onCancel={() => handleCancel()}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            titleMessage={MESSAGES.addIntegratedCampaigns}
            allowConfirm={allowConfirm}
        >
            <Box mt={2}>
                <CampaignAsyncSelect
                    keyValue="integrated_campaigns"
                    handleChange={handleChange}
                    campaignType="non-polio"
                />
            </Box>
        </ConfirmCancelModal>
    );
};
const AddModal = makeFullModal(
    AddIntegratedCampaignsModal,
    AddIntegratedCampaignsButton,
);

export { AddModal as AddIntegratedCampaignsModal };
