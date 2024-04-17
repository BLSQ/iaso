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
import { MultiSelect } from '../../../components/Inputs/MultiSelect';
import { Options } from '../types';
import { SingleSelect } from '../../../components/Inputs/SingleSelect';
import { useAvailableRoundsForCreate } from '../hooks/api/useGetBudgetProcessAvailableRounds';
import { useCreateBudgetProcess } from '../hooks/api/useCreateBudgetProcess';
import { useCreateBudgetProcessSchema } from './validation';

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
        useAvailableRoundsForCreate();

    const { mutate: confirm } = useCreateBudgetProcess();
    const schema = useCreateBudgetProcessSchema();
    const formik = useFormik({
        initialValues: { country: '', campaign: '', rounds: '' },
        validationSchema: schema,
        onSubmit: async values => {
            confirm(values);
        },
    });
    const allowConfirm =
        !formik.isSubmitting && formik.isValid && Boolean(formik.values.rounds);

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
        setCampaignOptions(filtered);
    }, [dropdownsData?.campaigns, formik.values.country]);

    // Filter "Rounds" values on "Campaign" change.
    const [currentRoundsOptions, setRoundsOptions] = useState<Options[]>([]);
    useEffect(() => {
        const rounds = dropdownsData?.rounds || [];
        const filtered = rounds.filter(
            i => String(i.campaign_id) === String(formik.values.campaign),
        );
        formik.setFieldValue('round', '');
        setRoundsOptions(filtered);
    }, [formik.values.campaign]);

    const titleMessage = formatMessage(MESSAGES.createBudgetProcessTitle);

    return (
        <FormikProvider value={formik}>
            {isFetchingDropdownData && <LoadingSpinner />}
            {!isFetchingDropdownData && (
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
                    allowConfirm={allowConfirm}
                    cancelMessage={MESSAGES.cancel}
                >
                    <Box mb={2} mt={2}>
                        <Field
                            label={formatMessage(MESSAGES.labelCountry)}
                            name="country"
                            component={SingleSelect}
                            options={dropdownsData?.countries || []}
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
                            name="rounds"
                            component={MultiSelect}
                            options={currentRoundsOptions}
                        />
                    </Box>
                </ConfirmCancelModal>
            )}
        </FormikProvider>
    );
};

const modal = makeFullModal(CreateBudgetProcessModal, AddButton);

export { modal as CreateBudgetProcessModal };
