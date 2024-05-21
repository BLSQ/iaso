import { Box, Divider, Grid } from '@mui/material';
import { Field, FormikProvider, useFormik } from 'formik';
import React, { FunctionComponent, useEffect, useState } from 'react';

import {
    AddButton,
    ConfirmCancelModal,
    LoadingSpinner,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';

import { MultiSelect } from '../../../components/Inputs/MultiSelect';
import { SingleSelect } from '../../../components/Inputs/SingleSelect';
import { useCreateBudgetProcess } from '../hooks/api/useCreateBudgetProcess';
import { useAvailableRoundsForCreate } from '../hooks/api/useGetBudgetProcessAvailableRounds';
import MESSAGES from '../messages';
import { Options } from '../types';
import { BudgetProcessModalTabs } from './BudgetProcessModalTabs';
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
        initialValues: { country: '', campaign: '' },
        validationSchema: schema,
        onSubmit: async values => {
            confirm(values);
        },
    });
    const { isSubmitting, isValid, dirty } = formik;
    const allowConfirm = !isSubmitting && isValid && dirty;

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dropdownsData?.campaigns, formik.values.country]);

    // Filter "Rounds" values on "Campaign" change.
    const [currentRoundsOptions, setRoundsOptions] = useState<Options[]>([]);
    useEffect(() => {
        const rounds = dropdownsData?.rounds || [];
        const filtered = rounds.filter(
            i => String(i.campaign_id) === String(formik.values.campaign),
        );
        formik.setFieldValue('round', undefined);
        setRoundsOptions(filtered);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dropdownsData?.rounds, formik.values.campaign]);

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
                    maxWidth="md"
                >
                    <Box mb={2}>
                        <Divider />
                    </Box>
                    <Grid container direction="row" spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Field
                                label={formatMessage(MESSAGES.labelCountry)}
                                name="country"
                                component={SingleSelect}
                                options={dropdownsData?.countries || []}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Field
                                label={formatMessage(MESSAGES.labelCampaign)}
                                name="campaign"
                                component={SingleSelect}
                                options={currentCampaignOptions}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Field
                                label={formatMessage(MESSAGES.labelRound)}
                                name="rounds"
                                component={MultiSelect}
                                options={currentRoundsOptions}
                                returnFullObject
                            />
                        </Grid>
                        <BudgetProcessModalTabs />
                    </Grid>
                </ConfirmCancelModal>
            )}
        </FormikProvider>
    );
};

const modal = makeFullModal(CreateBudgetProcessModal, AddButton);

export { modal as CreateBudgetProcessModal };
