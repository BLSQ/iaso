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
import {
    TextInput,
    DateInput,
    NumberInput,
} from '../../../../../components/Inputs';
import { useSaveDestruction } from '../../hooks/api';
import { EditIconButton } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';
import { useDestructionValidation } from './validation';

type Props = {
    destruction?: any;
    id?: number;
    isOpen: boolean;
    closeDialog: () => void;
    countryName: string;
    vaccine: Vaccine;
    vaccineStockId: string;
};

export const CreateEditDestruction: FunctionComponent<Props> = ({
    destruction,
    isOpen,
    closeDialog,
    countryName,
    vaccine,
    vaccineStockId,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: save } = useSaveDestruction();
    const validationSchema = useDestructionValidation();
    const formik = useFormik<any>({
        initialValues: {
            id: destruction?.id,
            action: destruction?.action,
            rrt_destruction_report_reception_date:
                destruction?.rrt_destruction_report_reception_date,
            destruction_report_date: destruction?.destruction_report_date,
            unusable_vials_destroyed: destruction?.unusable_vials_destroyed,
            lot_numbers: destruction?.lot_numbers,
            vaccine_stock: vaccineStockId,
        },
        onSubmit: values => save(values),
        validationSchema,
    });

    const titleMessage = destruction?.id ? MESSAGES.edit : MESSAGES.create;
    const title = `${countryName} - ${vaccine}: ${formatMessage(
        titleMessage,
    )} ${formatMessage(MESSAGES.destructionReports)}`;
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
                <Box mb={2} mt={2}>
                    <Field
                        label={formatMessage(MESSAGES.action)}
                        name="action"
                        component={TextInput}
                        required
                        shrinkLabel={false}
                    />
                </Box>
                <Field
                    label={formatMessage(
                        MESSAGES.rrt_destruction_report_reception_date,
                    )}
                    name="rrt_destruction_report_reception_date"
                    component={DateInput}
                    required
                />
                <Field
                    label={formatMessage(MESSAGES.report_date)}
                    name="destruction_report_date"
                    component={DateInput}
                    required
                />
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.vials_destroyed)}
                        name="unusable_vials_destroyed"
                        component={NumberInput}
                        required
                    />
                </Box>
                <Box>
                    <Field
                        label={formatMessage(MESSAGES.lot_numbers)}
                        name="lot_numbers"
                        component={TextInput}
                        shrinkLabel={false}
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithButton = makeFullModal(CreateEditDestruction, AddButton);
const modalWithIcon = makeFullModal(CreateEditDestruction, EditIconButton);

export {
    modalWithButton as CreateDestruction,
    modalWithIcon as EditDestruction,
};
