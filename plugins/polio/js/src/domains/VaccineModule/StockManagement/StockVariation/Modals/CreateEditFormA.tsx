import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';
import { EditIconButton } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';
import DocumentUploadWithPreview from '../../../../../../../../../hat/assets/js/apps/Iaso/components/files/pdf/DocumentUploadWithPreview';
import { processErrorDocsBase } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/files/pdf/utils';
import {
    DateInput,
    NumberInput,
    TextInput,
} from '../../../../../components/Inputs';
import { SingleSelect } from '../../../../../components/Inputs/SingleSelect';
import { Vaccine } from '../../../../../constants/types';
import { useSkipEffectUntilValue } from '../../../SupplyChain/hooks/utils';
import { useCampaignOptions, useSaveFormA } from '../../hooks/api';
import MESSAGES from '../../messages';
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
            round: formA?.round,
            // lot_numbers: formA?.lot_numbers ?? '',
            report_date: formA?.report_date,
            form_a_reception_date: formA?.form_a_reception_date,
            usable_vials_used: formA?.usable_vials_used,
            // unusable_vials: formA?.unusable_vials,
            vaccine_stock: vaccineStockId,
            document: formA?.document,
            comment: formA?.comment ?? null,
        },
        onSubmit: values => save(values),
        validationSchema,
    });
    const { setFieldValue } = formik;

    const { campaignOptions, isFetching, roundOptions } = useCampaignOptions(
        countryName,
        formik.values.campaign,
    );
    const titleMessage = formA?.id ? MESSAGES.edit : MESSAGES.create;
    const title = `${countryName} - ${vaccine}: ${formatMessage(
        titleMessage,
    )} ${formatMessage(MESSAGES.formA)}`;
    const allowConfirm = formik.isValid && !isEqual(formik.touched, {});
    const documentErrors = useMemo(() => {
        return processErrorDocsBase(formik.errors.document);
    }, [formik.errors.document]);

    const resetOnCampaignChange = useCallback(() => {
        setFieldValue('round', undefined);
    }, [setFieldValue]);

    useSkipEffectUntilValue(formik.values.campaign, resetOnCampaignChange);

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
                        options={campaignOptions}
                        withMarginTop
                        isLoading={isFetching}
                        disabled={!countryName}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.round)}
                        name="round"
                        component={SingleSelect}
                        options={roundOptions}
                        withMarginTop
                        isLoading={isFetching}
                        disabled={!formik.values.campaign}
                    />
                </Box>
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
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.forma_vials_used)}
                        name="usable_vials_used"
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
                <Box mb={2}>
                    <DocumentUploadWithPreview
                        errors={documentErrors}
                        onFilesSelect={files => {
                            if (files.length) {
                                formik.setFieldTouched('document', true);
                                formik.setFieldValue('document', files);
                            }
                        }}
                        document={formik.values.document}
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithButton = makeFullModal(CreateEditFormA, AddButton);
const modalWithIcon = makeFullModal(CreateEditFormA, EditIconButton);

export { modalWithButton as CreateFormA, modalWithIcon as EditFormA };
