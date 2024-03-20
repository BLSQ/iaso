import React, { FunctionComponent, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { Field, FormikProvider, useFormik } from 'formik';
import {
    AddButton,
    ConfirmCancelModal,
    LoadingSpinner,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';

import MESSAGES from '../messages';
import { SingleSelect } from '../../../components/Inputs/SingleSelect';
import { useGetNewBudgetProcessDropdowns } from '../hooks/api/useGetNewBudgetProcessDropdowns';
import {
    Options,
    OptionsCountry,
    OptionsCampaigns,
    OptionsRounds,
} from '../types';

const mapOptions = (
    item: OptionsCountry | OptionsCampaigns | OptionsRounds,
): Options => {
    return {
        label: `${item.name}`,
        value: item.id,
    };
};

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
};

const CreateBudgetProcessModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();

    const { data: dropdownsData, isFetching: isFetchingDropdownData } =
        useGetNewBudgetProcessDropdowns();

    const formik = useFormik({
        initialValues: {
            country: '',
            campaign: '',
            round: '',
        },
        onSubmit: async values => {
            // confirm(values);
            console.log(JSON.stringify(values, null, 2));
        },
    });

    // Filter "Campaign" values on "Country" change.
    const [currentCampaignOptions, setCampaignOptions] = useState<Options[]>(
        [],
    );
    useEffect(() => {
        const campaigns = dropdownsData?.campaigns || [];
        const filtered = campaigns.filter(
            i => String(i.country_id) === String(formik.values.country),
        );
        formik.setFieldValue('campaign', '');
        setCampaignOptions(filtered.map(mapOptions));
    }, [formik.values.country]);

    // Filter "Rounds" values on "Campaign" change.
    const [currentRoundOptions, setRoundOptions] = useState<Options[]>([]);
    useEffect(() => {
        const rounds = dropdownsData?.rounds || [];
        const filtered = rounds.filter(
            i => String(i.campaign_id) === String(formik.values.campaign),
        );
        formik.setFieldValue('round', '');
        setRoundOptions(filtered.map(mapOptions));
    }, [formik.values.campaign]);

    const titleMessage = formatMessage(MESSAGES.createBudgetProcessTitle);

    return (
        <>
            {isFetchingDropdownData && <LoadingSpinner />}
            {!isFetchingDropdownData && (
                <FormikProvider value={formik}>
                    <ConfirmCancelModal
                        open={isOpen}
                        closeDialog={closeDialog}
                        onClose={() => null}
                        id="create-budget-process"
                        dataTestId="create-budget-process"
                        titleMessage={titleMessage}
                        onConfirm={() => formik.handleSubmit()}
                        onCancel={() => null}
                        confirmMessage={MESSAGES.save}
                        cancelMessage={MESSAGES.cancel}
                    >
                        <Box mb={2} mt={2}>
                            <Field
                                label={formatMessage(MESSAGES.labelCountry)}
                                name="country"
                                component={SingleSelect}
                                options={
                                    dropdownsData?.countries.map(mapOptions) ||
                                    []
                                }
                            />
                        </Box>
                        <Box mb={2}>
                            <Field
                                label={formatMessage(MESSAGES.labelCampaign)}
                                name="campaign"
                                component={SingleSelect}
                                options={currentCampaignOptions}
                            />
                        </Box>
                        <Box mb={2}>
                            <Field
                                label={formatMessage(MESSAGES.labelRound)}
                                name="round"
                                component={SingleSelect}
                                options={currentRoundOptions}
                            />
                        </Box>
                    </ConfirmCancelModal>
                </FormikProvider>
            )}
        </>
    );
};

const modal = makeFullModal(CreateBudgetProcessModal, AddButton);

export { modal as CreateBudgetProcessModal };
