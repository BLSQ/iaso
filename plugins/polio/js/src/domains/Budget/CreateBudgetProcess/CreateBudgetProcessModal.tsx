import React, { FunctionComponent, useEffect, useState } from 'react';

import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
    AddButton,
} from 'bluesquare-components';

import { Box } from '@mui/material';
import { Field, FormikProvider, useFormik } from 'formik';
import MESSAGES from '../messages';
import { SelectCampaigns, SelectCountries, SelectRounds } from '../types';
import { SingleSelect } from '../../../components/Inputs/SingleSelect';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
};

const countries: SelectCountries[] = [
    { id: 1, name: 'USA' },
    { id: 2, name: 'France' },
    { id: 3, name: 'England' },
];

const campaigns: SelectCampaigns[] = [
    { id: 1, name: 'DRC-1-nopv2', country_id: 1 },
    { id: 2, name: 'DRC-2-nopv4', country_id: 3 },
    { id: 3, name: 'DRC-3-nopv8', country_id: 1 },
    { id: 4, name: 'DRC-4-nopv7', country_id: 2 },
    { id: 5, name: 'DRC-5-nopv1', country_id: 2 },
    { id: 6, name: 'DRC-6-nopv0', country_id: 3 },
];

const rounds: SelectRounds[] = [
    { id: 1, name: 'Round 1', campaign_id: 1 },
    { id: 2, name: 'Round 2', campaign_id: 1 },
    { id: 3, name: 'Round 3', campaign_id: 1 },
    { id: 4, name: 'Round 1', campaign_id: 2 },
    { id: 5, name: 'Round 2', campaign_id: 2 },
    { id: 6, name: 'Round 1', campaign_id: 3 },
    { id: 7, name: 'Round 2', campaign_id: 4 },
    { id: 8, name: 'Round 3', campaign_id: 5 },
    { id: 9, name: 'Round 1', campaign_id: 6 },
    { id: 10, name: 'Round 2', campaign_id: 6 },
    { id: 11, name: 'Round 3', campaign_id: 6 },
];

const mapOptions = item => {
    return {
        label: item.name,
        value: item.id,
    };
};

const CreateBudgetProcessModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();

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

    const [currentCampaignOptions, setCampaignOptions] = useState([]);
    useEffect(() => {
        const filtered = campaigns.filter(
            i => String(i.country_id) === String(formik.values.country),
        );
        formik.setFieldValue('campaign', '');
        setCampaignOptions(filtered.map(mapOptions));
    }, [formik.values.country]);

    const [currentRoundOptions, setRoundOptions] = useState([]);
    useEffect(() => {
        const filtered = rounds.filter(
            i => String(i.campaign_id) === String(formik.values.campaign),
        );
        formik.setFieldValue('round', '');
        setRoundOptions(filtered.map(mapOptions));
    }, [formik.values.campaign]);

    const titleMessage = formatMessage(MESSAGES.createBudgetProcessTitle);

    return (
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
                        label={formatMessage(MESSAGES.createBudgetProcessTitle)}
                        name="country"
                        component={SingleSelect}
                        options={countries.map(mapOptions)}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.createBudgetProcessTitle)}
                        name="campaign"
                        component={SingleSelect}
                        options={currentCampaignOptions}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.createBudgetProcessTitle)}
                        name="round"
                        component={SingleSelect}
                        options={currentRoundOptions}
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

const modal = makeFullModal(CreateBudgetProcessModal, AddButton);

export { modal as CreateBudgetProcessModal };
