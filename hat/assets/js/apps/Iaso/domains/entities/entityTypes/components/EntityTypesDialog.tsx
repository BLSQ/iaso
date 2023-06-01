/* eslint-disable camelcase */
import React, { ReactNode, FunctionComponent, useState } from 'react';
import { useFormik, FormikProvider, FormikProps } from 'formik';
import * as yup from 'yup';
import {
    useSafeIntl,
    IconButton as IconButtonComponent,
    IntlFormatMessage,
    IntlMessage,
} from 'bluesquare-components';
import { makeStyles, Box } from '@material-ui/core';
import isEqual from 'lodash/isEqual';

import InputComponent from '../../../../components/forms/InputComponent';
import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import { EntityType } from '../types/entityType';

import { baseUrls } from '../../../../constants/urls';

import { useGetForms } from '../hooks/requests/forms';
import { useTranslatedErrors } from '../../../../libs/validation';
import { useGetPossibleFieldsForEntityTypes } from '../../../forms/hooks/useGetPossibleFields';
import MESSAGES from '../messages';

type RenderTriggerProps = {
    openDialog: () => void;
};

type EmptyEntityType = Partial<EntityType>;

type Props = {
    titleMessage: IntlMessage;
    // eslint-disable-next-line no-unused-vars
    renderTrigger: ({ openDialog }: RenderTriggerProps) => ReactNode;
    initialData?: EntityType | EmptyEntityType;
    saveEntityType: (
        // eslint-disable-next-line no-unused-vars
        e: EntityType | EmptyEntityType,
        // eslint-disable-next-line no-unused-vars
        options: Record<string, () => void>,
    ) => void;
};

const useStyles = makeStyles(theme => ({
    root: {
        position: 'relative',
    },
    view: {
        position: 'absolute',
        top: theme.spacing(1),
        right: theme.spacing(1),
    },
}));

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
    const classes: Record<string, string> = useStyles();
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
    const { possibleFields, isFetchingForm } =
        useGetPossibleFieldsForEntityTypes({
            formId: values?.reference_form,
            enabled: isOpen,
        });
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
                maxWidth="xs"
                dialogProps={{
                    classNames: classes.dialog,
                }}
                onOpen={() => {
                    resetForm();
                    setIsOpen(true);
                }}
                onClosed={() => {
                    setIsOpen(false);
                }}
            >
                {!isNew && (
                    <Box className={classes.view}>
                        <IconButtonComponent
                            url={`/${baseUrls.formDetail}/formId/${values.reference_form}`}
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.viewForm}
                            dataTestId="see-form-button"
                        />
                    </Box>
                )}
                <div className={classes.root} id="entity-types-dialog">
                    <InputComponent
                        keyValue="name"
                        onChange={onChange}
                        value={values.name}
                        errors={getErrors('name')}
                        type="text"
                        label={MESSAGES.name}
                        required
                    />
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
                        options={possibleFields.map(field => ({
                            value: field.name,
                            label: field.label,
                        }))}
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
                        options={possibleFields.map(field => ({
                            value: field.name,
                            label: field.label,
                        }))}
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
                        options={possibleFields.map(field => ({
                            value: field.name,
                            label: field.label,
                        }))}
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
