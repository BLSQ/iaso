import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
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
import {
    dosesPerVial,
    useSkipEffectUntilValue,
} from '../../../SupplyChain/hooks/utils';
import {
    useCampaignOptions,
    useGetDosesOptions,
    useSaveFormA,
} from '../../hooks/api';
import MESSAGES from '../../messages';
import { useFormAValidation } from './validation';
import InputComponent from 'Iaso/components/forms/InputComponent';

type Props = {
    formA?: any;
    id?: number;
    isOpen: boolean;
    closeDialog: () => void;
    countryName: string;
    vaccine: Vaccine;
    vaccineStockId: string;
};

export type FormAFormValues = {
    id?: number;
    campaign?: string;
    round?: number;

    report_date?: string;
    form_a_reception_date?: string;
    usable_vials_used?: number;
    doses_per_vial: number;

    vaccine_stock: string;
    file?: File[] | string;
    comment: string | null;
    alternative_campaign: string | null;
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
    const { data: dosesOptions, isLoading: isLoadingDoses } =
        useGetDosesOptions(parseInt(vaccineStockId, 10));
    const validationSchema = useFormAValidation();
    const formik = useFormik<FormAFormValues>({
        initialValues: {
            id: formA?.id,
            campaign: formA?.campaign,
            round: formA?.round,
            report_date: formA?.report_date,
            form_a_reception_date: formA?.form_a_reception_date,
            usable_vials_used: formA?.usable_vials_used,
            doses_per_vial: formA?.doses_per_vial || dosesPerVial[vaccine],
            vaccine_stock: vaccineStockId,
            file: formA?.file,
            comment: formA?.comment ?? null,
            alternative_campaign: formA?.alternative_campaign ?? null,
        },
        onSubmit: values => save(values),
        validationSchema,
    });
    const { setFieldValue, setValues } = formik;
    const [withCustomObr, setWithCustomObr] = useState<boolean>(
        Boolean(formA?.alternative_campaign),
    );

    const { campaignOptions, isFetching, roundOptions } = useCampaignOptions(
        countryName,
        formik.values.campaign,
        formik.values.round,
    );
    const titleMessage = formA?.id ? MESSAGES.edit : MESSAGES.create;
    const title = `${countryName} - ${vaccine}: ${formatMessage(
        titleMessage,
    )} ${formatMessage(MESSAGES.formA)}`;
    const allowConfirm = formik.isValid && !isEqual(formik.touched, {});
    const fileErrors = useMemo(() => {
        return processErrorDocsBase(formik.errors.file);
    }, [formik.errors.file]);

    const resetOnCampaignChange = useCallback(() => {
        setFieldValue('round', undefined);
    }, [setFieldValue]);

    // Make sure the form does not have values for both campaign(+round) and alternative_campaign
    useEffect(() => {
        if (withCustomObr && formik.values.campaign) {
            setValues({
                ...formik.values,
                campaign: undefined,
                round: undefined,
            });
        }
        if (!withCustomObr && formik.values.alternative_campaign) {
            setFieldValue('alternative_campaign', undefined);
        }
    }, [
        withCustomObr,
        setFieldValue,
        setValues,
        formik.values,
        formik.values.campaign,
        formik.values.alternative_campaign,
    ]);
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
                {!withCustomObr && (
                    <>
                        <Box mb={2} mt={2}>
                            <Field
                                label={formatMessage(MESSAGES.campaign)}
                                name="campaign"
                                component={SingleSelect}
                                options={campaignOptions}
                                withMarginTop
                                isLoading={isFetching}
                                disabled={!countryName}
                            />
                            {!Boolean(formA?.campaign) && (
                                <InputComponent
                                    type="checkbox"
                                    keyValue={''}
                                    onChange={() => setWithCustomObr(true)}
                                    labelString={formatMessage(
                                        MESSAGES.useCustomObrName,
                                    )}
                                    withMarginTop={false}
                                    value={withCustomObr}
                                />
                            )}
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
                    </>
                )}
                {withCustomObr && (
                    <Box mb={2} mt={2}>
                        <Field
                            label={formatMessage(MESSAGES.customObrName)}
                            name="alternative_campaign"
                            component={TextInput}
                        />
                        {!Boolean(formA?.alternative_campaign) && (
                            <InputComponent
                                type="checkbox"
                                keyValue={''}
                                onChange={() => setWithCustomObr(false)}
                                labelString={formatMessage(
                                    MESSAGES.useCustomObrName,
                                )}
                                withMarginTop={false}
                                value={withCustomObr}
                            />
                        )}
                    </Box>
                )}
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
                        label={formatMessage(MESSAGES.doses_per_vial)}
                        name="doses_per_vial"
                        component={SingleSelect}
                        options={dosesOptions}
                        isLoading={isLoadingDoses}
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
                        errors={fileErrors}
                        onFilesSelect={files => {
                            if (files.length) {
                                formik.setFieldTouched('file', true);
                                formik.setFieldValue('file', files);
                            }
                        }}
                        document={formik.values.file}
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithButton = makeFullModal(CreateEditFormA, AddButton);
const modalWithIcon = makeFullModal(CreateEditFormA, EditIconButton);

export { modalWithButton as CreateFormA, modalWithIcon as EditFormA };
