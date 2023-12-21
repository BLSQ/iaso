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
import {
    TextInput,
    DateInput,
    NumberInput,
} from '../../../../../components/Inputs';
import { useCampaignOptions, useSaveFormA } from '../../hooks/api';
import { EditIconButton } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';

type Props = {
    formA?: any;
    id?: number;
    isOpen: boolean;
    closeDialog: () => void;
    countryName: string;
    vaccine: Vaccine;
};

export const CreateEditFormA: FunctionComponent<Props> = ({
    formA,
    isOpen,
    closeDialog,
    countryName,
    vaccine,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: save } = useSaveFormA();
    const formik = useFormik<any>({
        initialValues: {
            id: formA?.id,
            obr_name: formA?.obr_name,
            lot_numbers_for_usable_vials:
                formA?.lot_numbers_for_usable_vials ?? '',
            date_of_report: formA?.date_of_report,
            forma_reception_rrt: formA?.forma_reception_rrt,
            vials_used: formA?.vials_used,
            unusable_vials: formA?.unusable_vials,
            vials_missing: formA?.vials_missing,
        },
        onSubmit: values => save(values),
        // TODO add validation
        // validationSchema,
    });
    const { data: campaignOptions, isFetching: isFetchingCampaigns } =
        useCampaignOptions(countryName, vaccine);
    const titleMessage = formA?.id ? MESSAGES.edit : MESSAGES.create;
    const title = `${countryName} - ${vaccine}: ${formatMessage(
        titleMessage,
    )} ${formatMessage(MESSAGES.formA)}`;
    // TODO add conditions
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
                        label={formatMessage(MESSAGES.obrName)}
                        name="obr_name"
                        component={SingleSelect}
                        required
                        options={campaignOptions}
                        withMarginTop
                        isLoading={isFetchingCampaigns}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(
                            MESSAGES.lot_numbers_for_usable_vials,
                        )}
                        name="lot_numbers_for_usable_vials"
                        component={TextInput}
                        shrinkLabel={false}
                    />
                </Box>
                <Field
                    label={formatMessage(MESSAGES.date_of_report)}
                    name="date_of_report"
                    component={DateInput}
                />
                <Field
                    label={formatMessage(MESSAGES.forma_reception_rrt)}
                    name="forma_reception_rrt"
                    component={DateInput}
                />
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.forma_vials_used)}
                        name="vials_used"
                        component={NumberInput}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.forma_vials_missing)}
                        name="vials_missing"
                        component={NumberInput}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.forma_unusable_vials)}
                        name="unusable_vials"
                        component={NumberInput}
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithButton = makeFullModal(CreateEditFormA, AddButton);
const modalWithIcon = makeFullModal(CreateEditFormA, EditIconButton);

export { modalWithButton as CreateFormA, modalWithIcon as EditFormA };
