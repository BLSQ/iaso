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
};

export const CreateEditDestruction: FunctionComponent<Props> = ({
    destruction,
    isOpen,
    closeDialog,
    countryName,
    vaccine,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: save } = useSaveDestruction();
    const validationSchema = useDestructionValidation();
    const formik = useFormik<any>({
        initialValues: {
            id: destruction?.id,
            action: destruction?.action,
            destruction_reception_rrt: destruction?.destruction_reception_rrt,
            date_of_report: destruction?.date_of_report,
            vials_destroyed: destruction?.vials_destroyed,
            lot_numbers: destruction?.lot_numbers,
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
                    label={formatMessage(MESSAGES.destruction_reception_rrt)}
                    name="destruction_reception_rrt"
                    component={DateInput}
                />
                <Field
                    label={formatMessage(MESSAGES.date_of_report)}
                    name="date_of_report"
                    component={DateInput}
                />
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.vials_destroyed)}
                        name="vials_destroyed"
                        component={NumberInput}
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
