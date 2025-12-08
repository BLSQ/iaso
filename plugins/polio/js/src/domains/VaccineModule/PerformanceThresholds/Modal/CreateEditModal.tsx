import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    QueryBuilderInput,
    QueryBuilderListToReplace,
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
import { blue, purple } from '@mui/material/colors';
import { parseJson } from 'Iaso/domains/instances/utils/jsonLogicParse';

type Props = {
    performanceThreshold?: PerformanceThreshold;
    isOpen: boolean;
    closeDialog: () => void;
};
const queryBuilderListToReplace: QueryBuilderListToReplace[] = [
    {
        color: purple[700],
        items: ['AND', 'OR'],
    },

    {
        color: blue[700],
        items: ['=', '>', '<', '>=', '<='],
    },
];

const defaultLogic = { and: [{ '>=': [{ var: 'value' }, 0] }] };

const queryBuilderFields = {
    value: {
        type: 'number',
        queryBuilder: {
            type: 'number',
            operators: [
                'equal',
                'greater',
                'less',
                'greater_or_equal',
                'less_or_equal',
            ],
            preferWidgets: ['number'],
        },
    },
};

export const getHumanReadableJsonLogic = (json: string) => {
    if (!json) return '';

    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    const value = parsed['and'];
    return value
        ?.map((rule, index) => {
            const operator = Object.keys(rule)[0];
            const compareTo = rule[operator][1];
            if (index === 0) {
                return `value ${operator} ${compareTo}`;
            }
            return ` & value ${operator} ${compareTo}`;
        })
        .join('');
};

export const CreateEditModal: FunctionComponent<Props> = ({
    performanceThreshold,
    isOpen,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: save } = useSavePerformanceThreshold();

    // const validationSchema = usePerformanceThresholdValidation();
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
        // validationSchema,
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
            setFieldValue(
                keyValue,
                value ? JSON.stringify(parsedValue) : undefined,
            );
            setFieldTouched(keyValue, true);
        },
        [setFieldValue, setFieldTouched],
    );

    const titleMessage = performanceThreshold?.id
        ? MESSAGES.edit
        : MESSAGES.create;

    const allowConfirm = formik.isValid && !isEqual(formik.touched, {});

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
                        iconProps={{
                            label: MESSAGES.successThreshold,
                            value: formik.values.success_threshold
                                ? (getHumanReadableJsonLogic(
                                      formik.values.success_threshold,
                                  ) as string)
                                : '',
                            onClear: () => {
                                setFieldValue('success_threshold', undefined);
                                setFieldTouched('success_threshold', false);
                            },
                        }}
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
                        iconProps={{
                            label: MESSAGES.warningThreshold,
                            value: formik.values.warning_threshold
                                ? (getHumanReadableJsonLogic(
                                      formik.values.warning_threshold,
                                  ) as string)
                                : '',
                            onClear: () => {
                                setFieldValue('warning_threshold', undefined);
                                setFieldTouched('warning_threshold', false);
                            },
                        }}
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
                        iconProps={{
                            label: MESSAGES.failThreshold,
                            value: formik.values.fail_threshold
                                ? (getHumanReadableJsonLogic(
                                      formik.values.fail_threshold,
                                  ) as string)
                                : '',
                            onClear: () => {
                                setFieldValue('fail_threshold', undefined);
                                setFieldTouched('fail_threshold', false);
                            },
                        }}
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
