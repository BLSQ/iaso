import React, { FunctionComponent } from 'react';
import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';
import { Box } from '@mui/material';
import { Vaccine } from '../../../../../constants/types';
import MESSAGES from '../../messages';
import { SingleSelect } from '../../../../../components/Inputs/SingleSelect';
import { DateInput, NumberInput } from '../../../../../components/Inputs';
import { useCampaignOptions, useSaveFormA } from '../../hooks/api';
import { EditIconButton } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';
import { useFormAValidation } from './validation';

type Props = {
    formA?: any;
    id?: number;
    isOpen: boolean;
    closeDialog: () => void;
    countryName: string;
    vaccine: Vaccine;
    vaccineStockId: string;
};

export const CreateEditFormA: FunctionComponent<Props> = ({
    formA,
    isOpen,
    closeDialog,
    countryName,
    vaccine,
    vaccineStockId,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: save } = useSaveFormA();
    const validationSchema = useFormAValidation();
    const formik = useFormik<any>({
        initialValues: {
            id: formA?.id,
            campaign: formA?.campaign,
            // lot_numbers: formA?.lot_numbers ?? '',
            report_date: formA?.report_date,
            form_a_reception_date: formA?.form_a_reception_date,
            usable_vials_used: formA?.usable_vials_used,
            unusable_vials: formA?.unusable_vials,
            missing_vials: formA?.missing_vials,
            vaccine_stock: vaccineStockId,
        },
        onSubmit: values => save(values),
        validationSchema,
    });
    const { data: campaignOptions, isFetching: isFetchingCampaigns } =
        useCampaignOptions(countryName, formik.values.campaign);
    const titleMessage = formA?.id ? MESSAGES.edit : MESSAGES.create;
    const title = `${countryName} - ${vaccine}: ${formatMessage(
        titleMessage,
    )} ${formatMessage(MESSAGES.formA)}`;
    const allowConfirm = formik.isValid && !isEqual(formik.touched, {});

    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                titleMessage={title}
                onConfirm={() => formik.handleSubmit()}
                allowConfirm={allowConfirm}
                open={isOpen}
                closeDialog={closeDialog}
                id="formA-modal"
                dataTestId="formA-modal"
                onCancel={() => null}
                onClose={() => {
                    closeDialog();
                }}
                confirmMessage={MESSAGES.save}
                cancelMessage={MESSAGES.cancel}
            >
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.campaign)}
                        name="campaign"
                        component={SingleSelect}
                        required
                        options={campaignOptions}
                        withMarginTop
                        isLoading={isFetchingCampaigns}
                        disabled={!countryName}
                    />
                </Box>
                {/* <Box mb={2}>
                    <Field
                        label={formatMessage(
                            MESSAGES.lot_numbers_for_usable_vials,
                        )}
                        name="lot_numbers"
                        component={TextInput}
                        shrinkLabel={false}
                    />
                </Box> */}
                <Field
                    label={formatMessage(MESSAGES.report_date)}
                    name="report_date"
                    component={DateInput}
                    required
                />
                <Field
                    label={formatMessage(MESSAGES.form_a_reception_date)}
                    name="form_a_reception_date"
                    component={DateInput}
                    required
                />
                {/* <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.forma_vials_used)}
                        name="usable_vials_used"
                        component={NumberInput}
                        required
                    />
                </Box> */}
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.forma_vials_missing)}
                        name="missing_vials"
                        component={NumberInput}
                        required
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.forma_unusable_vials)}
                        name="unusable_vials"
                        component={NumberInput}
                        required
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithButton = makeFullModal(CreateEditFormA, AddButton);
const modalWithIcon = makeFullModal(CreateEditFormA, EditIconButton);

export { modalWithButton as CreateFormA, modalWithIcon as EditFormA };
