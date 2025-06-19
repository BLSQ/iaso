import React, { FunctionComponent, useMemo } from 'react';
import { Box } from '@mui/material';
import {
    IconButton,
    IntlFormatMessage,
    IntlMessage,
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
    AddButton,
    DndSelect,
} from 'bluesquare-components';
import { FormikProps, FormikProvider, useFormik } from 'formik';
import isEqual from 'lodash/isEqual';
import * as yup from 'yup';

import { EditIconButton } from 'Iaso/components/Buttons/EditIconButton';
import InputComponent from '../../../../components/forms/InputComponent';

import { baseUrls } from '../../../../constants/urls';
import { useTranslatedErrors } from '../../../../libs/validation';
import { formatLabel } from '../../../instances/utils';
import { useGetFormForEntityType, useGetForms } from '../hooks/requests/forms';
import MESSAGES from '../messages';
import { EntityType } from '../types/entityType';

type EmptyEntityType = Partial<EntityType>;

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    titleMessage: IntlMessage;
    initialData?: EntityType | EmptyEntityType;
    saveEntityType: (
        e: EntityType | EmptyEntityType,
        options: Record<string, () => void>,
    ) => void;
};

const getSelectedFields = (
    fieldValues: string[] | undefined,
    possibleFieldsOptions: Array<{ label: string; value: string }>,
) => {
    const selected = fieldValues?.map(field =>
        possibleFieldsOptions.find(f => f.value === field),
    );
    return selected?.filter(Boolean) as typeof possibleFieldsOptions;
};

const EntityTypesDialog: FunctionComponent<Props> = ({
    titleMessage,
    closeDialog,
    isOpen,
    initialData = {
        id: undefined,
        name: undefined,
        reference_form: undefined,
        fields_detail_info_view: undefined,
        fields_list_view: undefined,
        fields_duplicate_search: undefined,
    },
    saveEntityType,
}) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    const getSchema = () =>
        yup.lazy(() =>
            yup.object().shape({
                name: yup
                    .string()
                    .trim()
                    .required(formatMessage(MESSAGES.nameRequired)),
                reference_form: yup
                    .number()
                    .nullable()
                    .required(formatMessage(MESSAGES.referenceFormRequired)),
                fields_list_view: yup
                    .array()
                    .of(yup.string())
                    .nullable()
                    .required(),
                fields_detail_info_view: yup
                    .array()
                    .of(yup.string())
                    .nullable()
                    .required(),
                fields_duplicate_search: yup
                    .array()
                    .of(yup.string())
                    .nullable(),
            }),
        );

    const formik: FormikProps<EntityType | EmptyEntityType> = useFormik<
        EntityType | EmptyEntityType
    >({
        initialValues: initialData,
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: getSchema,
        onSubmit: values =>
            saveEntityType(values, {
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

    const onChange = (keyValue, value) => {
        setFieldTouched(keyValue, true);
        setFieldValue(keyValue, value);
    };

    const getErrors = useTranslatedErrors({
        errors,
        formatMessage,
        touched,
        messages: MESSAGES,
    });
    const isNew = !initialData?.id;
    const { data: formsList, isFetching: isFetchingForms } = useGetForms(isNew);
    const {
        possibleFields,
        isFetchingForm,
        name: formName,
    } = useGetFormForEntityType({
        formId: values?.reference_form,
        enabled: isOpen,
    });

    const possibleFieldsOptions = useMemo(
        () =>
            possibleFields.map(field => ({
                value: field.name,
                label: field.is_latest
                    ? formatLabel(field)
                    : `${formatLabel(field)} (${formatMessage(
                          MESSAGES.deprecated,
                      )})`,
            })),
        [formatMessage, possibleFields],
    );

    const selectedFieldsListView = useMemo(
        () => getSelectedFields(values.fields_list_view, possibleFieldsOptions),
        [values.fields_list_view, possibleFieldsOptions],
    );
    const selectedFieldsDetailInfoView = useMemo(
        () =>
            getSelectedFields(
                values.fields_detail_info_view,
                possibleFieldsOptions,
            ),
        [values.fields_detail_info_view, possibleFieldsOptions],
    );
    const selectedFieldsDuplicateSearch = useMemo(
        () =>
            getSelectedFields(
                values.fields_duplicate_search,
                possibleFieldsOptions,
            ),
        [values.fields_duplicate_search, possibleFieldsOptions],
    );

    const helperText = useMemo(() => {
        if (isNew && !values.reference_form) {
            return formatMessage(MESSAGES.selectReferenceForm);
        }
        return undefined;
    }, [formatMessage, isNew, values.reference_form]);
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
                <div id="entity-types-dialog">
                    {!isNew && formName && (
                        <Box mb={2}>
                            {`${formatMessage(MESSAGES.referenceForm)}: `}
                            {formName}
                            <Box ml={1} display="inline-block">
                                <IconButton
                                    url={`/${baseUrls.formDetail}/formId/${values.reference_form}`}
                                    icon="remove-red-eye"
                                    tooltipMessage={MESSAGES.viewForm}
                                    iconSize="small"
                                    // @ts-ignore
                                    fontSize="small"
                                    dataTestId="see-form-button"
                                />
                            </Box>
                        </Box>
                    )}
                    {isOpen && !isFetchingForm && (
                        <>
                            {isNew && (
                                <InputComponent
                                    required
                                    keyValue="reference_form"
                                    errors={getErrors('reference_form')}
                                    onChange={onChange}
                                    disabled={isFetchingForms}
                                    loading={isFetchingForms}
                                    value={values.reference_form || null}
                                    type="select"
                                    options={
                                        formsList?.map(t => ({
                                            label: t.name,
                                            value: t.id,
                                        })) || []
                                    }
                                    label={MESSAGES.referenceForm}
                                />
                            )}
                            <InputComponent
                                keyValue="name"
                                onChange={onChange}
                                value={values.name}
                                errors={getErrors('name')}
                                type="text"
                                label={MESSAGES.name}
                                required
                            />
                            <Box mt={2}>
                                <DndSelect
                                    options={possibleFieldsOptions}
                                    label={formatMessage(
                                        MESSAGES.fieldsListView,
                                    )}
                                    value={selectedFieldsListView}
                                    onChange={value => {
                                        onChange('fields_list_view', value);
                                    }}
                                    disabled={!values.reference_form}
                                    isRequired
                                    helperText={helperText}
                                />
                            </Box>

                            <Box mt={2}>
                                <DndSelect
                                    options={possibleFieldsOptions}
                                    label={formatMessage(
                                        MESSAGES.fieldsDetailInfoView,
                                    )}
                                    value={selectedFieldsDetailInfoView}
                                    onChange={value => {
                                        onChange(
                                            'fields_detail_info_view',
                                            value,
                                        );
                                    }}
                                    disabled={!values.reference_form}
                                    isRequired
                                    helperText={helperText}
                                />
                            </Box>

                            <Box mt={2}>
                                <DndSelect
                                    options={possibleFieldsOptions}
                                    label={formatMessage(
                                        MESSAGES.fieldsDuplicateSearch,
                                    )}
                                    value={selectedFieldsDuplicateSearch}
                                    onChange={value => {
                                        onChange(
                                            'fields_duplicate_search',
                                            value,
                                        );
                                    }}
                                    disabled={!values.reference_form}
                                    helperText={helperText}
                                />
                            </Box>
                        </>
                    )}
                </div>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithButton = makeFullModal(EntityTypesDialog, AddButton);
const modalWithIcon = makeFullModal(EntityTypesDialog, EditIconButton);

export {
    modalWithButton as AddEntityTypesDialog,
    modalWithIcon as EditEntityTypesDialog,
};
