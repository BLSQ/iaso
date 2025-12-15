import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    QueryBuilderInput,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import MESSAGES from '../messages';
import { Box } from '@mui/material';
import { TextInput } from '../../../../../src/components/Inputs';
import { PerformanceThreshold } from '../types';
import { isEqual } from 'lodash';
import { EditIconButton } from 'Iaso/components/Buttons/EditIconButton';
import { useSavePerformanceThreshold } from '../hooks/api';
import { parseJson } from 'Iaso/domains/instances/utils/jsonLogicParse';
import { defaultLogic, queryBuilderFields } from '../constants';
import { usePerformanceThresholdValidation } from './validation';
import { useGetJSonLogicConverter } from '../hooks/useGetJsonLogicToString';

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
    console.log('VALID', formik.isValid);
    console.log('TOUCHED', formik.touched);
    console.log('ERRORS', formik.errors);

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
    }, [setFieldValue, setFieldTouched, formik.values.success_threshold]);
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
    }, [setFieldValue, setFieldTouched, formik.values.warning_threshold]);
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
    }, [setFieldValue, setFieldTouched, formik.values.fail_threshold]);

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
                        initialLogic={
                            formik.values.success_threshold ?? defaultLogic
                        }
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
                        initialLogic={
                            formik.values.warning_threshold ?? defaultLogic
                        }
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
                        initialLogic={
                            formik.values.fail_threshold ?? defaultLogic
                        }
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
