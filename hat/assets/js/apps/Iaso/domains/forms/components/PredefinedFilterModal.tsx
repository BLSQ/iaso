import React, { FunctionComponent, useCallback, useState } from 'react';

import { Box, Tab, Tabs, Typography } from '@mui/material';
import { JsonLogicResult } from '@react-awesome-query-builder/mui';
import {
    ConfirmCancelModal,
    JsonLogicEditor,
    makeFullModal,
    QueryBuilder,
    useSafeIntl,
} from 'bluesquare-components';

import { useFormik } from 'formik';
import { EditIconButton } from 'Iaso/components/Buttons/EditIconButton';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { PredefinedFilterModalButton } from 'Iaso/domains/forms/components/PredefinedFilterModalButton';
import {
    FormPredefinedFilter,
    FormPredefinedFilterForm,
} from 'Iaso/domains/forms/types/forms';
import {
    JSONValue,
    parseJson,
} from 'Iaso/domains/instances/utils/jsonLogicParse';
import { useGetFieldsForForm } from 'Iaso/domains/workflows/hooks/useHumanReadableJsonLogicForForm';
import { useTranslatedErrors } from 'Iaso/libs/validation';
import { isEqual } from 'lodash';
import * as yup from 'yup';
import MESSAGES from '../messages';

type Props = {
    isOpen: boolean;
    id?: number;
    form_id: number;
    predefinedFilter?: FormPredefinedFilter;
    dataTestId?: string;
    closeDialog: () => void;
    save: (filter: FormPredefinedFilter) => void;
    isSaving: boolean;
};

const PredefinedfilterModal: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    id,
    form_id,
    predefinedFilter,
    dataTestId,
    save,
    isSaving,
}) => {
    const { formatMessage } = useSafeIntl();
    const fields = useGetFieldsForForm(form_id);
    const configValidationSchema = yup.object().shape({
        name: yup.string().required(formatMessage(MESSAGES.requiredField)),
        short_name: yup
            .string()
            .required(formatMessage(MESSAGES.requiredField)),
        json_logic: yup
            .object()
            .required(formatMessage(MESSAGES.requiredField)),
    });
    const {
        values,
        setFieldValue,
        isValid,
        handleSubmit,
        isSubmitting,
        errors,
        touched,
        setFieldTouched,
    } = useFormik<FormPredefinedFilterForm>({
        initialValues: {
            name: predefinedFilter?.name,
            short_name: predefinedFilter?.short_name,
            json_logic: predefinedFilter?.json_logic,
        },
        validationSchema: configValidationSchema,
        onSubmit: (newValues: FormPredefinedFilterForm) => {
            save({
                id: predefinedFilter?.id || 0,
                name: newValues.name || '',
                short_name: newValues.short_name || '',
                json_logic: newValues.json_logic || {},
                form_id,
                created_at:
                    predefinedFilter?.created_at || new Date().getTime(),
                updated_at: new Date().getTime(),
            });
            closeDialog();
        },
    });
    const onChange = useCallback(
        (keyValue, value) => {
            setFieldTouched(keyValue, true);
            setFieldValue(keyValue, value);
        },
        [setFieldValue, setFieldTouched],
    );
    const getErrors = useTranslatedErrors({
        errors,
        touched,
        formatMessage,
        messages: MESSAGES,
    });
    const [tab, setTab] = useState<'infos' | 'query' | 'json'>('infos');
    const handleChangeQuery = useCallback(
        (result: JsonLogicResult) => {
            let parsedValue;
            if (
                result?.logic &&
                fields &&
                !isEqual(values.json_logic, result.logic)
            ) {
                parsedValue = parseJson({
                    value: result.logic as JSONValue,
                    fields,
                });
                setFieldTouched('json_logic');
                setFieldValue('json_logic', parsedValue);
            }
        },
        [fields, setFieldTouched, setFieldValue, values],
    );
    return (
        <ConfirmCancelModal
            allowConfirm={
                !isEqual(touched, {}) && isValid && !isSaving && !isSubmitting
            }
            titleMessage={formatMessage(
                Boolean(id)
                    ? MESSAGES.predefinedFiltersEditModalTitle
                    : MESSAGES.predefinedFiltersAddModalTitle,
            )}
            onConfirm={handleSubmit}
            onCancel={() => {
                closeDialog();
            }}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            open={isOpen}
            closeDialog={closeDialog}
            dataTestId={dataTestId || ''}
            id={id?.toString() || ''}
            onClose={() => null}
            maxWidth={tab === 'query' ? 'lg' : 'sm'}
        >
            <>
                <Tabs value={tab} onChange={(_, newtab) => setTab(newtab)}>
                    <Tab value="infos" label={formatMessage(MESSAGES.infos)} />
                    <Tab
                        value="query"
                        label={formatMessage(MESSAGES.queryTab)}
                    />
                    <Tab value="json" label={formatMessage(MESSAGES.jsonTab)} />
                </Tabs>
                {tab === 'infos' && (
                    <Box>
                        <InputComponent
                            type="text"
                            keyValue="name"
                            onChange={onChange}
                            errors={getErrors('name')}
                            value={values.name}
                            required
                            label={MESSAGES.name}
                        />
                        <InputComponent
                            type="text"
                            keyValue="short_name"
                            onChange={onChange}
                            required
                            errors={getErrors('short_name')}
                            value={values.short_name}
                            label={MESSAGES.short_name}
                        />
                    </Box>
                )}
                {tab === 'query' && (
                    <Box mt={2}>
                        <QueryBuilder
                            logic={values.json_logic || {}}
                            fields={fields}
                            onChange={handleChangeQuery}
                        />
                    </Box>
                )}
                {tab === 'json' && (
                    <JsonLogicEditor
                        initialLogic={values.json_logic}
                        changeLogic={(newLogic: JSONValue) => {
                            setFieldTouched('json_logic');
                            setFieldValue('json_logic', newLogic);
                        }}
                    />
                )}
                {getErrors('json_logic') && (
                    <Typography variant="caption" color="red">
                        {getErrors('json_logic')}
                    </Typography>
                )}
            </>
        </ConfirmCancelModal>
    );
};
const modalWithButton = makeFullModal(
    PredefinedfilterModal,
    PredefinedFilterModalButton,
);
const modalWithIcon = makeFullModal(PredefinedfilterModal, EditIconButton);

export {
    modalWithButton as PredefinedFilterModal,
    modalWithIcon as EditPredefinedFilterModal,
};
