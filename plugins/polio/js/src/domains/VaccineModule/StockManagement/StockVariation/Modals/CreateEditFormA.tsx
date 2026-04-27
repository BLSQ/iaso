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
import InputComponent from 'Iaso/components/forms/InputComponent';
import { useSkipEffectUntilValue } from 'Iaso/hooks/useSkipEffectUntilValue';
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
    EDIT_ACCESS_FULL,
    RECEIVED,
    RECEIVED_TO_TEMPORARY,
    SESSION_TEMPORARY,
    TEMPORARY,
} from '../../constants';
import { useCampaignOptions, useSaveFormA } from '../../hooks/api';
import MESSAGES from '../../messages';
import { DosesPerVialDropdown } from '../../types';
import { FormAFormValues } from '../types';
import { useAvailablePresentations } from './dropdownOptions';
import { useFormAUiState } from './useFormAUiState';
import { useFormAValidation } from './validation';

type StatusConfirmDirection =
    | typeof RECEIVED_TO_TEMPORARY
    | typeof SESSION_TEMPORARY;

type Props = {
    formA?: any;
    id?: number;
    isOpen: boolean;
    closeDialog: () => void;
    countryName: string;
    vaccine: Vaccine;
    vaccineStockId: string;
    dosesOptions?: DosesPerVialDropdown;
    defaultDosesPerVial: number | undefined;
};

export const CreateEditFormA: FunctionComponent<Props> = ({
    formA,
    isOpen,
    closeDialog,
    countryName,
    vaccine,
    vaccineStockId,
    dosesOptions,
    defaultDosesPerVial,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: save } = useSaveFormA();
    const hasFixedDosesPerVial = Boolean(defaultDosesPerVial);
    const validationSchema = useFormAValidation();
    const isNew = !formA?.id;
    const originalStatus = formA?.status ?? RECEIVED;
    // Backend-driven enum: "full" | "completion_only" | "none". New forms are
    // effectively "full". See useFormAUiState for how this maps to field gating.
    const editAccess = isNew ? EDIT_ACCESS_FULL : formA?.edit_access;
    // Extracted so the onSubmit closure can diff against initial state
    // without referencing `formik` before it's assigned.
    const initialValues: FormAFormValues = {
        id: formA?.id,
        status: originalStatus,
        campaign: formA?.campaign,
        round: formA?.round,
        report_date: formA?.report_date,
        form_a_reception_date: formA?.form_a_reception_date,
        usable_vials_used: formA?.usable_vials_used,
        doses_per_vial: formA?.doses_per_vial || defaultDosesPerVial,
        vaccine_stock: vaccineStockId,
        file: formA?.file,
        comment: formA?.comment,
        // `alternative_campaign` maps to a plain CharField on the serializer
        // (no allow_null), so coalesce null -> undefined to let the payload
        // sanitizer drop the key instead of sending `null` and being rejected.
        alternative_campaign: formA?.alternative_campaign ?? undefined,
    };
    const formik = useFormik<FormAFormValues>({
        initialValues,
        onSubmit: values => {
            if (!values.id) {
                return save(values);
            }
            // PATCH: send only fields that actually changed, plus identifiers.
            // The backend rejects post-window requests containing non-allowlisted
            // keys even if their values haven't changed.
            const patch: Record<string, unknown> = {
                id: values.id,
                vaccine_stock: values.vaccine_stock,
            };
            for (const key of Object.keys(values) as Array<
                keyof FormAFormValues
            >) {
                if (
                    key !== 'id' &&
                    key !== 'vaccine_stock' &&
                    !isEqual(values[key], initialValues[key])
                ) {
                    patch[key] = values[key];
                }
            }
            return save(patch);
        },
        validationSchema,
    });
    const { setFieldTouched, setFieldValue, setValues } = formik;
    const [temporaryStatusWarningType, setTemporaryStatusWarningType] =
        useState<StatusConfirmDirection | null>(null);
    const [withCustomObr, setWithCustomObr] = useState<boolean>(
        Boolean(formA?.alternative_campaign),
    );

    const availableDosesPresentations = useAvailablePresentations(
        dosesOptions,
        formA,
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
    const fileErrors = useMemo(
        () => processErrorDocsBase(formik.errors.file),
        [formik.errors.file],
    );
    const uiState = useFormAUiState({
        isNew,
        editAccess,
        originalStatus,
        currentStatus: formik.values.status,
        withinEditWindow: isNew || Boolean(formA?.within_edit_window),
    });

    const resetOnCampaignChange = useCallback(() => {
        setFieldValue('round', undefined);
    }, [setFieldValue]);

    const applyTemporaryToggle = useCallback(
        (checked: boolean) => {
            // setFieldValue does not touch fields; mark status touched so the
            // "must have something touched" save-button gate (allowConfirm) clears
            // even when the user only flips the temporary checkbox.
            setFieldTouched('status', true, false);
            if (checked) {
                setFieldValue('status', TEMPORARY);
                setFieldValue('form_a_reception_date', undefined);
                setFieldValue('file', undefined);
            } else {
                setFieldValue('status', RECEIVED);
            }
        },
        [setFieldTouched, setFieldValue],
    );

    const handleTemporaryToggle = useCallback(
        (_key: string | null, isSwitchingToTemporary: boolean) => {
            const currentStatus = formik.values.status;
            const hasCompletionValues = Boolean(
                formik.values.form_a_reception_date || formik.values.file,
            );

            const needsTemporaryConfirm =
                isSwitchingToTemporary &&
                currentStatus === RECEIVED &&
                hasCompletionValues;

            const wasSavedAsReceived = !isNew && originalStatus === RECEIVED;

            if (needsTemporaryConfirm) {
                setTemporaryStatusWarningType(
                    wasSavedAsReceived
                        ? RECEIVED_TO_TEMPORARY
                        : SESSION_TEMPORARY,
                );
                return;
            }

            applyTemporaryToggle(isSwitchingToTemporary);
        },
        [
            applyTemporaryToggle,
            formik.values.file,
            formik.values.form_a_reception_date,
            formik.values.status,
            isNew,
            originalStatus,
        ],
    );

    const handleConfirmStatusChange = useCallback(() => {
        applyTemporaryToggle(true);
        setTemporaryStatusWarningType(null);
    }, [applyTemporaryToggle]);

    const handleCancelStatusChange = () => {
        setTemporaryStatusWarningType(null);
    };

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
    const warningMessage =
        temporaryStatusWarningType === RECEIVED_TO_TEMPORARY
            ? formatMessage(MESSAGES.received_to_temporary_warning)
            : formatMessage(MESSAGES.temporary_toggle_unsaved_warning);

    return (
        <FormikProvider value={formik}>
            {temporaryStatusWarningType && (
                <ConfirmCancelModal
                    open
                    closeDialog={handleCancelStatusChange}
                    onClose={handleCancelStatusChange}
                    id="temporary-form-a-status-warning"
                    dataTestId="temporary-form-a-status-warning"
                    titleMessage={MESSAGES.temporary_status_change_title}
                    onConfirm={handleConfirmStatusChange}
                    onCancel={handleCancelStatusChange}
                    confirmMessage={MESSAGES.save}
                    cancelMessage={MESSAGES.cancel}
                >
                    {warningMessage}
                </ConfirmCancelModal>
            )}
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
                            <InputComponent
                                type="checkbox"
                                keyValue={''}
                                onChange={handleTemporaryToggle}
                                labelString={formatMessage(
                                    MESSAGES.temporary_form_a,
                                )}
                                withMarginTop={false}
                                value={uiState.isTemporary}
                                disabled={!uiState.canEditStatus}
                            />
                            <Field
                                label={formatMessage(MESSAGES.campaign)}
                                name="campaign"
                                component={SingleSelect}
                                options={campaignOptions}
                                withMarginTop
                                isLoading={isFetching}
                                disabled={
                                    !countryName ||
                                    !uiState.canEditCampaignAndRound
                                }
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
                                disabled={
                                    !formik.values.campaign ||
                                    !uiState.canEditCampaignAndRound
                                }
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
                    disabled={!uiState.canEditReportDate}
                    required
                />
                <Field
                    label={formatMessage(MESSAGES.form_a_reception_date)}
                    name="form_a_reception_date"
                    component={DateInput}
                    disabled={!uiState.canEditReceptionDate}
                    required={!uiState.isTemporary}
                />
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.forma_vials_used)}
                        name="usable_vials_used"
                        component={NumberInput}
                        disabled={!uiState.canEditVials}
                        required
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.doses_per_vial)}
                        name="doses_per_vial"
                        component={SingleSelect}
                        options={availableDosesPresentations}
                        disabled={
                            hasFixedDosesPerVial || !uiState.canEditDosesPerVial
                        }
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
                        disabled={!uiState.canEditComment}
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
                        disabled={!uiState.canEditFile}
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithButton = makeFullModal(CreateEditFormA, AddButton);
const modalWithIcon = makeFullModal(CreateEditFormA, EditIconButton);

export { modalWithButton as CreateFormA, modalWithIcon as EditFormA };
