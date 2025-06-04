import { Box, Chip } from '@mui/material';
import {
    IconButton,
    IntlFormatMessage,
    IntlMessage,
    useSafeIntl,
} from 'bluesquare-components';
import { FormikProps, FormikProvider, useFormik } from 'formik';
import isEqual from 'lodash/isEqual';
import React, {
    FunctionComponent,
    ReactNode,
    useCallback,
    useMemo,
    useState,
} from 'react';
import * as yup from 'yup';

import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../../components/forms/InputComponent';
import { EntityType } from '../types/entityType';

import { baseUrls } from '../../../../constants/urls';
import { useTranslatedErrors } from '../../../../libs/validation';
import { formatLabel } from '../../../instances/utils';
import { useGetFormForEntityType, useGetForms } from '../hooks/requests/forms';
import MESSAGES from '../messages';

type RenderTriggerProps = {
    openDialog: () => void;
};

type EmptyEntityType = Partial<EntityType>;

type Props = {
    titleMessage: IntlMessage;
    renderTrigger: ({ openDialog }: RenderTriggerProps) => ReactNode;
    initialData?: EntityType | EmptyEntityType;
    saveEntityType: (
        e: EntityType | EmptyEntityType,
        options: Record<string, () => void>,
    ) => void;
};

export const EntityTypesDialog: FunctionComponent<Props> = ({
    titleMessage,
    renderTrigger,
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
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [closeModal, setCloseModal] = useState<any>();
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
                onSuccess: () => {
                    closeModal.closeDialog();
                },
            }),
    });
    const {
        values,
        setFieldValue,
        errors,
        touched,
        setFieldTouched,
        isValid,
        initialValues,
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

    const renderTags = useCallback(
        (tagValue, getTagProps) =>
            tagValue
                .sort((a, b) =>
                    formatLabel(a).localeCompare(formatLabel(b), undefined, {
                        sensitivity: 'accent',
                    }),
                )
                .map((option, index) => {
                    const field = possibleFields.find(
                        f => f.name === option.value,
                    );
                    return (
                        <Chip
                            color={field?.is_latest ? 'primary' : 'secondary'}
                            label={option.label}
                            {...getTagProps({ index })}
                        />
                    );
                }),
        [possibleFields],
    );

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

    return (
        <FormikProvider value={formik}>
            {/* @ts-ignore */}
            <ConfirmCancelDialogComponent
                allowConfirm={isValid && !isEqual(values, initialValues)}
                titleMessage={titleMessage}
                onConfirm={closeDialog => {
                    setCloseModal({ closeDialog });
                    handleSubmit();
                }}
                onCancel={closeDialog => {
                    closeDialog();
                    resetForm();
                }}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
                renderTrigger={renderTrigger}
                maxWidth="md"
                onOpen={() => {
                    resetForm();
                    setIsOpen(true);
                }}
                onClosed={() => {
                    setIsOpen(false);
                }}
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
                    <InputComponent
                        type="select"
                        multi
                        required
                        disabled={isFetchingForm || !values.reference_form}
                        keyValue="fields_list_view"
                        onChange={(key, value) =>
                            onChange(key, value ? value.split(',') : null)
                        }
                        value={!isFetchingForm ? values.fields_list_view : []}
                        label={MESSAGES.fieldsListView}
                        options={possibleFieldsOptions}
                        renderTags={renderTags}
                        helperText={
                            isNew && !values.reference_form
                                ? formatMessage(MESSAGES.selectReferenceForm)
                                : undefined
                        }
                    />
                    <InputComponent
                        type="select"
                        multi
                        required
                        disabled={isFetchingForm || !values.reference_form}
                        loading={isFetchingForm}
                        keyValue="fields_detail_info_view"
                        onChange={(key, value) =>
                            onChange(key, value ? value.split(',') : null)
                        }
                        value={
                            !isFetchingForm
                                ? values.fields_detail_info_view
                                : []
                        }
                        label={MESSAGES.fieldsDetailInfoView}
                        options={possibleFieldsOptions}
                        renderTags={renderTags}
                        helperText={
                            isNew && !values.reference_form
                                ? formatMessage(MESSAGES.selectReferenceForm)
                                : undefined
                        }
                    />
                    <InputComponent
                        type="select"
                        multi
                        disabled={isFetchingForm || !values.reference_form}
                        keyValue="fields_duplicate_search"
                        onChange={(key, value) =>
                            onChange(key, value ? value.split(',') : null)
                        }
                        value={
                            !isFetchingForm
                                ? values.fields_duplicate_search
                                : []
                        }
                        label={MESSAGES.fieldsDuplicateSearch}
                        renderTags={renderTags}
                        options={possibleFieldsOptions}
                        helperText={
                            isNew && !values.reference_form
                                ? formatMessage(MESSAGES.selectReferenceForm)
                                : undefined
                        }
                    />
                </div>
            </ConfirmCancelDialogComponent>
        </FormikProvider>
    );
};
