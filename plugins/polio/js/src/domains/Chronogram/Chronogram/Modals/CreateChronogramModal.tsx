import React, { FunctionComponent, useEffect, useState } from 'react';
import { Box, Divider, Grid } from '@mui/material';

import {
    AddButton,
    ConfirmCancelModal,
    LoadingSpinner,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';

import { SingleSelect } from '../../../../components/Inputs/SingleSelect';

import { DropdownOptions } from '../../types';
import { useCreateChronogram } from '../api/useCreateChronogram';
import { useAvailableRoundsForCreate } from '../api/useGetChronogramAvailableRounds';
import { useCreateChronogramSchema } from '../hooks/validation';
import MESSAGES from '../messages';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
};

const CreateChronogramModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();

    const { data: dropdownsData, isFetching: isFetchingDropdownData } =
        useAvailableRoundsForCreate();

    const { mutate: confirm } = useCreateChronogram();
    const schema = useCreateChronogramSchema();
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
    const [currentCampaignOptions, setCampaignOptions] = useState<
        DropdownOptions[]
    >([]);
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
    const [currentRoundsOptions, setRoundsOptions] = useState<
        DropdownOptions[]
    >([]);
    useEffect(() => {
        const rounds = dropdownsData?.rounds || [];
        const filtered = rounds
            .filter(
                i =>
                    String(i.campaign_id) === String(formik.values.campaign) &&
                    !i.on_hold,
            )
            .map(r => {
                return {
                    label: `${formatMessage(MESSAGES.round)} ${r.label}`,
                    value: r.value,
                };
            });
        formik.setFieldValue('round', undefined);
        setRoundsOptions(filtered);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dropdownsData?.rounds, formik.values.campaign]);

    return (
        <FormikProvider value={formik}>
            {isFetchingDropdownData && <LoadingSpinner />}
            {!isFetchingDropdownData && (
                <ConfirmCancelModal
                    open={isOpen}
                    closeDialog={closeDialog}
                    onClose={() => null}
                    id="create-chronnogram"
                    dataTestId="create-chronnogram"
                    titleMessage={formatMessage(MESSAGES.createChronogramTitle)}
                    onConfirm={() => formik.handleSubmit()}
                    onCancel={() => null}
                    confirmMessage={MESSAGES.save}
                    allowConfirm={allowConfirm}
                    cancelMessage={MESSAGES.cancel}
                    maxWidth="xs"
                >
                    <Box mb={2}>
                        <Divider />
                    </Box>
                    <Grid container direction="row" spacing={2}>
                        <Grid item xs={12}>
                            <Field
                                label={formatMessage(MESSAGES.labelCountry)}
                                name="country"
                                component={SingleSelect}
                                options={dropdownsData?.countries || []}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Field
                                label={formatMessage(MESSAGES.labelCampaign)}
                                name="campaign"
                                component={SingleSelect}
                                options={currentCampaignOptions}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Field
                                label={formatMessage(MESSAGES.labelRound)}
                                name="round"
                                component={SingleSelect}
                                options={currentRoundsOptions}
                                returnFullObject
                            />
                        </Grid>
                    </Grid>
                </ConfirmCancelModal>
            )}
        </FormikProvider>
    );
};

const modal = makeFullModal(CreateChronogramModal, AddButton);

export { modal as CreateChronogramModal };
