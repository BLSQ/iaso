import React, { FunctionComponent, useCallback, useEffect } from 'react';
import { Typography } from '@mui/material';
import {
    ConfirmCancelModal,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import { useFormik } from 'formik';
import { isEqual } from 'lodash';
import InputComponent from '../../../../components/forms/InputComponent';
import { useTranslatedErrors } from '../../../../libs/validation';
import { useGetGroupDropdown } from '../../hooks/requests/useGetGroups';
import { useGetGroupSetsDropdown } from '../../hooks/requests/useGetGroupSets';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import {
    editableFieldsManyToManyFields,
    orgUnitChangeRequestConfigTypeCreation,
} from '../constants';
import { useGetFormDropdownOptions } from '../hooks/api/useGetFormDropdownOptions';
import { useRetrieveOrgUnitChangeRequestConfig } from '../hooks/api/useRetrieveOrgUnitChangeRequestConfig';
import { useSaveOrgUnitChangeRequestConfiguration } from '../hooks/api/useSaveOrgUnitChangeRequestConfiguration';
import { useCallbackOrgUnitConfigurationTypeDisplayName } from '../hooks/useCallbackOrgUnitConfigurationTypeDisplayName';
import { useOrgUnitsEditableFieldsOptions } from '../hooks/useOrgUnitEditableFieldsOptions';
import { useOrgUnitsEditableOptions } from '../hooks/useOrgUnitsEditableOptions';
import { useValidationSchemaOUCRC } from '../hooks/useValidationSchemaOUCRC';
import MESSAGES from '../messages';
import {
    OrgUnitChangeRequestConfiguration,
    OrgUnitChangeRequestConfigurationForm,
} from '../types';

type Props = {
    config: OrgUnitChangeRequestConfiguration;
    isOpen: boolean;
    closeDialog: () => void;
};

//  we should filter forms, groups, groupsets, types using correct project id
/// marquer les types comme requis

const OrgUnitChangeRequestConfigDialog: FunctionComponent<Props> = ({
    config,
    isOpen,
    closeDialog,
}) => {
    const isCreation = config.type === orgUnitChangeRequestConfigTypeCreation;
    const configValidationSchema = useValidationSchemaOUCRC();
    const {
        values,
        setFieldValue,
        isValid,
        handleSubmit,
        isSubmitting,
        errors,
        touched,
        setFieldTouched,
        setValues,
    } = useFormik<OrgUnitChangeRequestConfigurationForm>({
        initialValues: {
            projectId: config.project.id,
            type: config.type,
            orgUnitTypeId: config.orgUnitType.id,
            orgUnitsEditable: isCreation ? true : undefined,
            editableFields: undefined,
            possibleTypeIds: undefined,
            possibleParentTypeIds: undefined,
            groupSetIds: undefined,
            editableReferenceFormIds: undefined,
            otherGroupIds: undefined,
        },
        validationSchema: configValidationSchema,
        onSubmit: (newValues: OrgUnitChangeRequestConfigurationForm) => {
            saveConfig({
                configId: config.id,
                data: newValues,
            });
            closeDialog();
        },
    });
    const { data: fetchedConfig, isLoading: isLoadingFullConfig } =
        useRetrieveOrgUnitChangeRequestConfig(config?.id);
    useEffect(() => {
        if (fetchedConfig) {
            setValues(fetchedConfig);
        }
    }, [fetchedConfig, setValues]);
    const {
        data: orgUnitTypeOptions,
        isFetching: isFetchingOrgUnitTypeOptions,
    } = useGetOrgUnitTypesDropdownOptions(config.project.id);
    const { data: groupOptions, isFetching: isFetchingGroupOptions } =
        useGetGroupDropdown({
            projectIds: `${config.project.id}`,
        });
    const { data: formOptions, isFetching: isFetchingFormOptions } =
        useGetFormDropdownOptions(config.orgUnitType.id);
    const { data: groupSetOptions, isFetching: isFetchingGroupSetOptions } =
        useGetGroupSetsDropdown({
            project_ids: `${config.project.id}`,
        });
    const { mutateAsync: saveConfig } =
        useSaveOrgUnitChangeRequestConfiguration();
    const orgUnitsEditableOptions = useOrgUnitsEditableOptions();
    const orgUnitEditableFieldsOptions = useOrgUnitsEditableFieldsOptions();
    const { formatMessage } = useSafeIntl();
    const getTypeDisplayName = useCallbackOrgUnitConfigurationTypeDisplayName();
    const getErrors = useTranslatedErrors({
        errors,
        touched,
        formatMessage,
        messages: MESSAGES,
    });

    const onChange = useCallback(
        (keyValue, value) => {
            setFieldTouched(keyValue, true);
            setFieldValue(keyValue, value);
        },
        [setFieldValue, setFieldTouched],
    );

    const onChangeEditableFields = useCallback(
        (keyValue, value) => {
            // if a many-to-many field has some value, but the field is removed from editableFields, we need to clean the field
            if (value) {
                const split = value.split(',');
                editableFieldsManyToManyFields.forEach(field => {
                    if (!split.includes(field)) {
                        setFieldValue(field, undefined);
                    }
                });
            }
            onChange(keyValue, value);
        },
        [onChange, setFieldValue],
    );

    const onChangeOrgUnitsEditable = useCallback(
        (keyValue, value) => {
            // if we say that the org units are no longer editable, we need to clean everything up
            const boolValue = value === 'true';
            if (!boolValue) {
                editableFieldsManyToManyFields.forEach(field => {
                    setFieldValue(field, undefined);
                });
                setFieldValue('editableFields', undefined);
                setFieldValue('groupSetIds', undefined);
            }
            onChange(keyValue, boolValue);
        },
        [onChange, setFieldValue],
    );
    const allowConfirm = isValid && !isSubmitting && !isEqual(touched, {});
    return (
        <ConfirmCancelModal
            open={isOpen}
            onClose={() => null}
            id="oucrcDialogCreate"
            dataTestId="add-org-unit-config-button"
            titleMessage={
                config?.id
                    ? formatMessage(MESSAGES.oucrcCreateUpdateModalTitle)
                    : formatMessage(MESSAGES.oucrcCreateSecondStepModalTitle)
            }
            closeDialog={closeDialog}
            maxWidth="sm"
            allowConfirm={allowConfirm}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={
                config?.id
                    ? MESSAGES.oucrcModalUpdateButton
                    : MESSAGES.oucrcModalCreateButton
            }
            onConfirm={() => handleSubmit()}
            onCancel={() => {
                closeDialog();
            }}
        >
            {isLoadingFullConfig && <LoadingSpinner />}
            <Typography variant="h6" component="h6">
                {formatMessage(MESSAGES.project)}: {config.project.name}
            </Typography>
            <Typography variant="h6" component="h6">
                {formatMessage(MESSAGES.type)}:{' '}
                {getTypeDisplayName(config.type)}
            </Typography>
            <Typography variant="h6" component="h6">
                {formatMessage(MESSAGES.orgUnitType)}: {config.orgUnitType.name}
            </Typography>
            {!isCreation && (
                <InputComponent
                    type="radio"
                    keyValue="orgUnitsEditable"
                    onChange={onChangeOrgUnitsEditable}
                    value={values.orgUnitsEditable}
                    errors={getErrors('orgUnitsEditable')}
                    label={MESSAGES.orgUnitsEditable}
                    options={orgUnitsEditableOptions}
                />
            )}
            {values?.orgUnitsEditable && (
                <InputComponent
                    type="select"
                    multi
                    keyValue="editableFields"
                    onChange={onChangeEditableFields}
                    value={values.editableFields}
                    errors={getErrors('editableFields')}
                    label={MESSAGES.editableFields}
                    options={orgUnitEditableFieldsOptions}
                />
            )}
            {values?.orgUnitsEditable && (
                <InputComponent
                    type="select"
                    multi
                    keyValue="groupSetIds"
                    onChange={onChange}
                    value={values.groupSetIds}
                    errors={getErrors('groupSetIds')}
                    label={MESSAGES.groupSetIds}
                    options={groupSetOptions}
                    loading={isFetchingGroupSetOptions}
                />
            )}
            {values?.editableFields?.includes('possibleTypeIds') && (
                <InputComponent
                    type="select"
                    multi
                    keyValue="possibleTypeIds"
                    onChange={onChange}
                    value={values.possibleTypeIds}
                    errors={getErrors('possibleTypeIds')}
                    label={MESSAGES.possibleTypeIds}
                    options={orgUnitTypeOptions}
                    loading={isFetchingOrgUnitTypeOptions}
                />
            )}
            {values?.editableFields?.includes('possibleParentTypeIds') && (
                <InputComponent
                    type="select"
                    multi
                    keyValue="possibleParentTypeIds"
                    onChange={onChange}
                    value={values.possibleParentTypeIds}
                    errors={getErrors('possibleParentTypeIds')}
                    label={MESSAGES.possibleParentTypeIds}
                    options={orgUnitTypeOptions}
                    loading={isFetchingOrgUnitTypeOptions}
                />
            )}
            {values?.editableFields?.includes('editableReferenceFormIds') && (
                <InputComponent
                    type="select"
                    multi
                    keyValue="editableReferenceFormIds"
                    onChange={onChange}
                    value={values.editableReferenceFormIds}
                    errors={getErrors('editableReferenceFormIds')}
                    label={MESSAGES.editableReferenceFormIds}
                    options={formOptions}
                    loading={isFetchingFormOptions}
                />
            )}
            {values?.editableFields?.includes('otherGroupIds') && (
                <InputComponent
                    type="select"
                    multi
                    keyValue="otherGroupIds"
                    onChange={onChange}
                    value={values.otherGroupIds}
                    errors={getErrors('otherGroupIds')}
                    label={MESSAGES.otherGroupIds}
                    options={groupOptions}
                    loading={isFetchingGroupOptions}
                />
            )}
        </ConfirmCancelModal>
    );
};

export { OrgUnitChangeRequestConfigDialog as OrgUnitChangeRequestConfigDialogCreateSecondStep };
