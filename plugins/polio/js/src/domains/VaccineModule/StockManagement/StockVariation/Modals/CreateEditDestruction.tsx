import React, { FunctionComponent, useCallback } from 'react';
import {
    AddButton,
    ConfirmCancelModal,
    FilesUpload,
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
import { acceptPDF, processErrorDocsBase } from '../../../SupplyChain/Details/utils';

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
            // lot_numbers: destruction?.lot_numbers,
            vaccine_stock: vaccineStockId,
            document:destruction?.document,
            comment:destruction?.comment ?? null
        },
        onSubmit: values => save(values),
        validationSchema,
    });

    const processDocumentErrors = useCallback(processErrorDocsBase, [formik.errors]);

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
                        label={formatMessage(MESSAGES.title)}
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
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.comment)}
                        name="comment"
                        multiline
                        component={TextInput}
                        shrinkLabel={false}
                    />
                </Box>
                {/* <Box>
                    <Field
                        label={formatMessage(MESSAGES.lot_numbers)}
                        name="lot_numbers"
                        component={TextInput}
                        shrinkLabel={false}
                    />
                </Box> */}
                <Box mb={2}>
                    <FilesUpload
                        accept={acceptPDF}
                        files={formik.values.document ? [formik.values.document] : []}
                        onFilesSelect={files => {
                            if (files.length) {
                                formik.setFieldTouched(`document`, true);
                                formik.setFieldValue(`document`, files);
                            }
                        }}
                        multi={false}
                        errors={processDocumentErrors(formik.errors.document)}

                        placeholder={formatMessage(
                            MESSAGES.document,
                        )}
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
