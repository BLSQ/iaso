import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    QueryBuilderInput,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';
import { EditIconButton } from 'Iaso/components/Buttons/EditIconButton';
import { parseJson } from 'Iaso/domains/instances/utils/jsonLogicParse';
import { TextInput } from '../../../../../src/components/Inputs';
import { defaultLogic, queryBuilderFields } from '../constants';
import { useSavePerformanceThreshold } from '../hooks/api';
import { useGetJSonLogicConverter } from '../hooks/useGetJsonLogicToString';
import MESSAGES from '../messages';
import { PerformanceThreshold } from '../types';
import { usePerformanceThresholdValidation } from './validation';

type Props = {
    performanceThreshold?: PerformanceThreshold;
    isOpen: boolean;
    closeDialog: () => void;
};

export const CreateEditModal: FunctionComponent<Props> = ({
    performanceThreshold,
    isOpen,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: save } = useSavePerformanceThreshold();
    const convertJsonLogicToString = useGetJSonLogicConverter();
    const validationSchema = usePerformanceThresholdValidation();
    const formik = useFormik<any>({
        initialValues: {
            id: performanceThreshold?.id,
            indicator: performanceThreshold?.indicator,
            success_threshold: performanceThreshold?.success_threshold, // JSON Logic
            warning_threshold: performanceThreshold?.warning_threshold, // JSON Logic
            fail_threshold: performanceThreshold?.fail_threshold, // JSON Logic
            created_at: performanceThreshold?.created_at,
            updated_at: performanceThreshold?.updated_at,
        },
        onSubmit: values => save(values),
        validationSchema,
    });

    const { setFieldValue, setFieldTouched } = formik;
    const handleChangeQueryBuilder = useCallback(
        (keyValue, value) => {
            let parsedValue;
            if (value)
                parsedValue = parseJson({
                    value,
                    fields: queryBuilderFields,
                });
            setFieldTouched(keyValue, true);
            setFieldValue(
                keyValue,
                value ? JSON.stringify(parsedValue) : undefined,
            );
        },
        [setFieldValue, setFieldTouched],
    );

    const titleMessage = performanceThreshold?.id
        ? MESSAGES.edit
        : MESSAGES.create;

    const allowConfirm = formik.isValid && !isEqual(formik.touched, {});

    const successIconProps = useMemo(() => {
        return {
            label: MESSAGES.successThreshold,
            value: formik.values.success_threshold
                ? (convertJsonLogicToString(
                      formik.values.success_threshold,
                  ) as string)
                : '',
            onClear: () => {
                setFieldValue('success_threshold', undefined);
                setFieldTouched('success_threshold', false);
            },
        };
    }, [
        formik.values.success_threshold,
        convertJsonLogicToString,
        setFieldValue,
        setFieldTouched,
    ]);
    const warningIconProps = useMemo(() => {
        return {
            label: MESSAGES.warningThreshold,
            value: formik.values.warning_threshold
                ? (convertJsonLogicToString(
                      formik.values.warning_threshold,
                  ) as string)
                : '',
            onClear: () => {
                setFieldValue('warning_threshold', undefined);
                setFieldTouched('warning_threshold', false);
            },
        };
    }, [
        formik.values.warning_threshold,
        convertJsonLogicToString,
        setFieldValue,
        setFieldTouched,
    ]);
    const failIconProps = useMemo(() => {
        return {
            label: MESSAGES.failThreshold,
            value: formik.values.fail_threshold
                ? (convertJsonLogicToString(
                      formik.values.fail_threshold,
                  ) as string)
                : '',
            onClear: () => {
                setFieldValue('fail_threshold', undefined);
                setFieldTouched('fail_threshold', false);
            },
        };
    }, [
        formik.values.fail_threshold,
        convertJsonLogicToString,
        setFieldValue,
        setFieldTouched,
    ]);
    const getJsonValue = useCallback(
        keyValue => {
            const jsonValue = formik.values[keyValue]
                ? JSON.parse(formik.values[keyValue])
                : undefined;

            return jsonValue || defaultLogic;
        },
        [formik.values],
    );
    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                titleMessage={formatMessage(titleMessage)}
                onConfirm={() => formik.handleSubmit()}
                allowConfirm={allowConfirm}
                open={isOpen}
                closeDialog={closeDialog}
                id="performance-threshold-modal"
                dataTestId="performance-threshold-modal"
                onCancel={() => null}
                onClose={() => {
                    closeDialog();
                }}
                confirmMessage={MESSAGES.save}
                cancelMessage={MESSAGES.cancel}
            >
                <Box mb={2} mt={2}>
                    <Field
                        label={formatMessage(MESSAGES.indicator)}
                        name="indicator"
                        component={TextInput}
                        required
                    />
                </Box>
                <Box mb={2}>
                    <QueryBuilderInput
                        label={MESSAGES.successThreshold}
                        onChange={logic =>
                            handleChangeQueryBuilder('success_threshold', logic)
                        }
                        initialLogic={getJsonValue('success_threshold')}
                        fields={queryBuilderFields}
                        iconProps={successIconProps}
                    />
                </Box>
                <Box mb={2}>
                    <QueryBuilderInput
                        label={MESSAGES.warningThreshold}
                        onChange={logic =>
                            handleChangeQueryBuilder('warning_threshold', logic)
                        }
                        initialLogic={getJsonValue('warning_threshold')}
                        fields={queryBuilderFields}
                        iconProps={warningIconProps}
                    />
                </Box>
                <Box mb={2}>
                    <QueryBuilderInput
                        label={MESSAGES.failThreshold}
                        onChange={logic =>
                            handleChangeQueryBuilder('fail_threshold', logic)
                        }
                        initialLogic={getJsonValue('fail_threshold')}
                        fields={queryBuilderFields}
                        iconProps={failIconProps}
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithButton = makeFullModal(CreateEditModal, AddButton);
const modalWithIcon = makeFullModal(CreateEditModal, EditIconButton);

export {
    modalWithButton as CreatePerformanceThreshold,
    modalWithIcon as EditPerformanceThreshold,
};
