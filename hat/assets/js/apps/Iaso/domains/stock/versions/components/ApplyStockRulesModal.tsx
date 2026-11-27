import React, { FunctionComponent, useMemo } from 'react';
import {
    ConfirmCancelModal,
    IntlFormatMessage,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { FormikProps, FormikProvider, useFormik } from 'formik';
import * as yup from 'yup';

import { useApiTasksCreateApplystockrulesCreate } from 'Iaso/api/applyStockRules/endpoints/apply-stock-rules/apply-stock-rules';
import DatesRange from 'Iaso/components/filters/DatesRange';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { useGetSkusDropdownOptions } from 'Iaso/domains/stock/hooks/useGetSkusDropdownOptions';
import MESSAGES from 'Iaso/domains/stock/messages';
import { useTranslatedErrors } from 'Iaso/libs/validation';
import { getApiParamDateString, getUrlParamDateObject } from 'Iaso/utils/dates';
import { ApplyStockRulesButton } from './ModalButtons';

type ApplyStockRulesFormValues = {
    skuId: number | undefined;
    startDate: string | undefined;
    endDate: string | undefined;
};

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
};

const initialValues: ApplyStockRulesFormValues = {
    skuId: undefined,
    startDate: undefined,
    endDate: undefined,
};

const useApplyStockRulesSchema = () => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    return useMemo(
        () =>
            yup.object().shape({
                skuId: yup
                    .number()
                    .required(formatMessage(MESSAGES.skuRequired)),
                startDate: yup.string().nullable().notRequired(),
                endDate: yup
                    .string()
                    .nullable()
                    .notRequired()
                    .test(
                        'end-after-start',
                        formatMessage(MESSAGES.endDateBeforeStartDate),
                        function validateDateOrder(endDate) {
                            const { startDate } = this.parent;
                            if (!startDate || !endDate) {
                                return true;
                            }
                            return !getUrlParamDateObject(endDate).isBefore(
                                getUrlParamDateObject(startDate),
                                'day',
                            );
                        },
                    ),
            }),
        [formatMessage],
    );
};

const ApplyStockRulesModalContent: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
}) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const { data: skusList, isFetching: isFetchingSkus } =
        useGetSkusDropdownOptions({});

    const { mutate: launchApplyStockRules, isLoading } =
        useApiTasksCreateApplystockrulesCreate({
            mutation: {
                meta: {
                    snackSuccessMessage: MESSAGES.taskLaunched,
                    useApiErrorMessage: true,
                },
            },
        });

    const formik: FormikProps<ApplyStockRulesFormValues> =
        useFormik<ApplyStockRulesFormValues>({
            initialValues,
            validateOnBlur: true,
            validationSchema: useApplyStockRulesSchema(),
            onSubmit: values => {
                if (values.skuId === undefined) {
                    return;
                }
                const startDate = values.startDate
                    ? getApiParamDateString(values.startDate)
                    : undefined;
                const endDate = values.endDate
                    ? getApiParamDateString(values.endDate)
                    : undefined;

                launchApplyStockRules(
                    {
                        data: {
                            sku_id: Number(values.skuId),
                            ...(startDate ? { start_date: startDate } : {}),
                            ...(endDate ? { end_date: endDate } : {}),
                        },
                    },
                    {
                        onSuccess: () => {
                            formik.resetForm();
                            closeDialog();
                        },
                    },
                );
            },
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

    const onChange = (keyValue: string, value: any) => {
        setFieldValue(keyValue, value, true);
        setFieldTouched(keyValue, true, false);
    };

    const getErrors = useTranslatedErrors({
        errors,
        formatMessage,
        touched,
        messages: MESSAGES,
    });

    const handleCancel = () => {
        resetForm();
        closeDialog();
    };

    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                id="apply-stock-rules-dialog"
                dataTestId="apply-stock-rules-dialog"
                allowConfirm={
                    isValid && values.skuId !== undefined && !isLoading
                }
                closeOnConfirm={false}
                titleMessage={MESSAGES.applyRulesTitle}
                onConfirm={handleSubmit}
                onCancel={handleCancel}
                onClose={() => null}
                closeDialog={closeDialog}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.confirm}
                maxWidth="sm"
                open={isOpen}
            >
                <div id="apply-stock-rules-form">
                    {isOpen && (
                        <>
                            <InputComponent
                                type="select"
                                required
                                keyValue="skuId"
                                loading={isFetchingSkus}
                                onChange={onChange}
                                value={values.skuId}
                                errors={getErrors('skuId')}
                                label={MESSAGES.sku}
                                options={skusList ?? []}
                            />
                            <DatesRange
                                xs={12}
                                sm={6}
                                md={6}
                                lg={6}
                                keyDateFrom="startDate"
                                keyDateTo="endDate"
                                onChangeDate={onChange}
                                dateFrom={values.startDate}
                                dateTo={values.endDate}
                                labelFrom={MESSAGES.startDate}
                                labelTo={MESSAGES.endDate}
                                errors={[
                                    getErrors('startDate'),
                                    getErrors('endDate'),
                                ]}
                            />
                        </>
                    )}
                </div>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

const modalWithButton = makeFullModal(
    ApplyStockRulesModalContent,
    ApplyStockRulesButton,
);

export { modalWithButton as ApplyStockRulesModal };
