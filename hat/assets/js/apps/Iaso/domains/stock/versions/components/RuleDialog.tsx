import React, { FunctionComponent, useMemo, useState } from 'react';
import {
    IntlFormatMessage,
    IntlMessage,
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
    AddButton,
    LoadingSpinner,
} from 'bluesquare-components';
import { FormikProps, FormikProvider, useFormik } from 'formik';
import isEqual from 'lodash/isEqual';
import * as yup from 'yup';

import { EditIconButton } from 'Iaso/components/Buttons/EditIconButton';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { useGetPossibleFields } from 'Iaso/domains/forms/hooks/useGetPossibleFields';
import { useGetFormsDropdownOptions } from 'Iaso/domains/mappings/hooks/requests/useGetFormsDropdownOptions';
import { useGetImpacts } from 'Iaso/domains/stock/hooks/useGetImpacts';
import { useGetSkusDropdownOptions } from 'Iaso/domains/stock/hooks/useGetSkusDropdownOptions';
import MESSAGES from 'Iaso/domains/stock/messages';
import { StockItemRuleDto } from 'Iaso/domains/stock/types/stocks';
import { useTranslatedErrors } from 'Iaso/libs/validation';
import { DropdownOptions } from 'Iaso/types/utils';

type EmptyStockItemRule = Partial<StockItemRuleDto>;

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    titleMessage: IntlMessage;
    initialData?: StockItemRuleDto | EmptyStockItemRule;
    saveRule: (
        e: StockItemRuleDto | EmptyStockItemRule,
        options: Record<string, () => void>,
    ) => void;
};

const RuleDialog: FunctionComponent<Props> = ({
    titleMessage,
    closeDialog,
    isOpen,
    initialData = {
        id: undefined,
        sku: undefined,
        form: undefined,
        question: undefined,
        impact: undefined,
    },
    saveRule,
}) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    const getSchema = () =>
        yup.lazy(() =>
            yup.object().shape({
                sku: yup
                    .number()
                    .required(formatMessage(MESSAGES.nameRequired)),
                form: yup
                    .number()
                    .required(formatMessage(MESSAGES.nameRequired)),
                question: yup
                    .string()
                    .required(formatMessage(MESSAGES.nameRequired)),
                impact: yup
                    .string()
                    .required(formatMessage(MESSAGES.nameRequired)),
            }),
        );

    const formik: FormikProps<StockItemRuleDto | EmptyStockItemRule> =
        useFormik<StockItemRuleDto | EmptyStockItemRule>({
            initialValues: initialData,
            enableReinitialize: true,
            validateOnBlur: true,
            validationSchema: getSchema,
            onSubmit: values =>
                saveRule(values, {
                    onSuccess: closeDialog,
                }),
        });
    const {
        values,
        setFieldValue,
        errors,
        touched,
        setFieldTouched,
        isValid,
        handleSubmit,
        resetForm,
    } = formik;
    const [form, setForm] = useState<number | undefined>(values?.form);
    const onChange = (keyValue: string, value: any) => {
        // noinspection JSIgnoredPromiseFromCall
        setFieldTouched(keyValue, true);
        // noinspection JSIgnoredPromiseFromCall
        setFieldValue(keyValue, value);
    };

    const getErrors = useTranslatedErrors({
        errors,
        formatMessage,
        touched,
        messages: MESSAGES,
    });
    const { data: formsList, isFetching: isFetchingForms } =
        useGetFormsDropdownOptions({});
    const { data: skusList, isFetching: isFetchingSkus } =
        useGetSkusDropdownOptions({});
    const impacts = useGetImpacts();
    const {
        possibleFields: possibleFields,
        isFetchingForm: isFetchingPossibleFields,
    } = useGetPossibleFields(form);
    const possibleFieldsOptions = useMemo(() => {
        return possibleFields.map(field => {
            return {
                label: field.label,
                value: field.name,
            } as DropdownOptions<string>;
        });
    }, [possibleFields]);
    return (
        <FormikProvider value={formik}>
            {/* @ts-ignore */}
            <ConfirmCancelModal
                allowConfirm={isValid && !isEqual(values, initialData)}
                titleMessage={titleMessage}
                onConfirm={handleSubmit}
                onCancel={() => {
                    closeDialog();
                    resetForm();
                }}
                onClose={() => null}
                closeDialog={closeDialog}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
                maxWidth="md"
                open={isOpen}
            >
                <div id="stock-keeping-unit-dialog">
                    {isOpen && (
                        <>
                            {isFetchingForms ||
                            isFetchingSkus ||
                            isFetchingForms ? (
                                <LoadingSpinner />
                            ) : (
                                <>
                                    <InputComponent
                                        type="select"
                                        keyValue="sku"
                                        loading={isFetchingSkus}
                                        onChange={onChange}
                                        value={values.sku}
                                        errors={getErrors('sku')}
                                        label={MESSAGES.sku}
                                        options={skusList ?? []}
                                    />
                                    <InputComponent
                                        type="select"
                                        keyValue="form"
                                        loading={isFetchingForms}
                                        onChange={(key, value) => {
                                            setForm(value);
                                            onChange(key, value);
                                        }}
                                        errors={getErrors('form')}
                                        value={values.form}
                                        label={MESSAGES.form}
                                        options={formsList ?? []}
                                    />
                                    <InputComponent
                                        type="select"
                                        keyValue="question"
                                        loading={isFetchingPossibleFields}
                                        onChange={onChange}
                                        errors={getErrors('question')}
                                        value={values.question}
                                        label={MESSAGES.question}
                                        options={possibleFieldsOptions ?? []}
                                        disabled={values.form == null}
                                    />
                                    <InputComponent
                                        type="select"
                                        keyValue="impact"
                                        onChange={onChange}
                                        errors={getErrors('impact')}
                                        value={values.impact}
                                        label={MESSAGES.impact}
                                        options={impacts ?? []}
                                    />
                                </>
                            )}
                        </>
                    )}
                </div>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithButton = makeFullModal(RuleDialog, AddButton);
const modalWithIcon = makeFullModal(RuleDialog, EditIconButton);

export { modalWithButton as AddRuleDialog, modalWithIcon as EditRuleDialog };
