import React, { FunctionComponent, useCallback } from 'react';
import {
    ConfirmCancelModal,
    IntlFormatMessage,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { isEqual } from 'lodash';
import { Typography } from '@mui/material';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { useTranslatedErrors } from '../../../../libs/validation';
import MESSAGES from '../messages';
import { EditIconButton } from '../../../../components/Buttons/EditIconButton';
import InputComponent from '../../../../components/forms/InputComponent';
import { editableFields, editableFieldsForFrontend } from '../constants';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { useGetGroupDropdown } from '../../hooks/requests/useGetGroups';
import { useGetFormDropdownOptions } from '../hooks/api/useGetFormDropdownOptions';
import { useSaveOrgUnitChangeRequestConfiguration } from '../hooks/api/useSaveOrgUnitChangeRequestConfiguration';
import { useOrgUnitsEditableOptions } from '../hooks/useOrgUnitsEditableOptions';
import { OrgUnitChangeRequestConfiguration } from '../types';

type Props = {
    config: OrgUnitChangeRequestConfiguration;
    isOpen: boolean;
    closeDialog: () => void;
};

const useCreationSchema = () => {
    const { formatMessage } = useSafeIntl();
    return Yup.object().shape({
        projectId: Yup.string().nullable().required(formatMessage(MESSAGES.requiredField)),
        // orgUnitTypeId: Yup.string().nullable().required(formatMessage(MESSAGES.requiredField)),
        orgUnitTypeId: Yup.string().nullable(),
        orgUnitsEditable: Yup.string().nullable().required(formatMessage(MESSAGES.requiredField)),
        editableFields: Yup.array().of(Yup.string()).nullable(),
        possibleTypeIds: Yup.array().of(Yup.string()).nullable(),
        possibleParentTypeIds: Yup.array().of(Yup.string()).nullable(),
        groupSetIds: Yup.array().of(Yup.string()).nullable(),
        editableReferenceFormIds: Yup.array().of(Yup.string()).nullable(),
        otherGroupIds: Yup.array().of(Yup.string()).nullable(),
    });
};

const editableFieldsOptions = (formatMessage: IntlFormatMessage) => {
    return editableFields.map(field => {
        return {
            value: field,
            label: formatMessage(MESSAGES[field]),
        };
    });
};

const OrgUnitChangeRequestConfigDialogUpdate: FunctionComponent<Props> = ({
    config,
    isOpen,
    closeDialog,
}) => {
    const creationSchema = useCreationSchema();
    const {
        values,
        setFieldValue,
        isValid,
        handleSubmit,
        isSubmitting,
        errors,
        touched,
        setFieldTouched,
    } = useFormik({
        initialValues: {
            projectId: config.projectId,
            // orgUnitTypeId: config.orgUnitTypeId,
            orgUnitTypeId: 6,
            orgUnitsEditable: '',
            editableFields: undefined,
            possibleTypeIds: undefined,
            possibleParentTypeIds: undefined,
            groupSetIds: undefined,
            editableReferenceFormIds: undefined,
            otherGroupIds: undefined,
        },
        validationSchema: creationSchema,
        onSubmit: () => {
            console.log('*** onSubmit values = ', values);
        },
    });

    const { data: orgUnitTypeOptions, isLoading: isLoadingTypes } = useGetOrgUnitTypesDropdownOptions();
    const { data: groupOptions, isLoading: isLoadingGroups } = useGetGroupDropdown({});
    const { data: formOptions, isFetching: isFetchingForms } = useGetFormDropdownOptions();
    const { data: groupSetOptions, isLoading: isLoadingGroupSets } = useGetGroupDropdown({});
    const { mutateAsync: saveConfig } = useSaveOrgUnitChangeRequestConfiguration();
    const orgUnitsEditableOptions = useOrgUnitsEditableOptions();

    const { formatMessage } = useSafeIntl();
    const getErrors = useTranslatedErrors({
        errors,
        touched,
        formatMessage,
        messages: MESSAGES,
    });

    const onChange = useCallback(
        (keyValue, value) => {
            console.log('*** update - onChange - keyValue = ', keyValue);
            console.log('*** update - onChange - value = ', value);
            setFieldTouched(keyValue, true);
            setFieldValue(keyValue, value);
        },
        [setFieldValue, setFieldTouched],
    );

    const onChangeEditableFields = useCallback((keyValue, value) => {
            const split = value.split(',');
            editableFieldsForFrontend.forEach((field) => {
                if (!split.includes(field)) {
                    setFieldValue(field, undefined);
                }
            });
            onChange(keyValue, value);
        },
        [onChange, setFieldValue],
    );

    const onChangeOrgUnitsEditable = useCallback((keyValue, value) => {
            const boolValue = value === 'true';
            if (!boolValue) {
                editableFieldsForFrontend.forEach((field) => {
                    setFieldValue(field, undefined);
                });
                setFieldValue('editableFields', undefined);
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
                // ? formatMessage(MESSAGES.oucrcModalUpdateButton)
                // : formatMessage(MESSAGES.oucrcModalCreateButton)
            }
            onConfirm={() => handleSubmit()}
            onCancel={() => {
                closeDialog();
            }}
        >
            <Typography
                variant="h6"
                component="h6"
            >
                Project: {config.projectId}
            </Typography>
            <Typography
                variant="h6"
                component="h6"
            >
                Org Unit Type: {config.orgUnitTypeId}
            </Typography>
            <InputComponent
                type="radio"
                keyValue="orgUnitsEditable"
                onChange={onChangeOrgUnitsEditable}
                value={values.orgUnitsEditable}
                errors={getErrors('orgUnitsEditable')}
                label={MESSAGES.orgUnitsEditable}
                options={orgUnitsEditableOptions}
            />
            {values?.orgUnitsEditable && (
                <InputComponent
                    type="select"
                    multi
                    keyValue="editableFields"
                    onChange={onChangeEditableFields}
                    value={values.editableFields}
                    errors={getErrors('editableFields')}
                    label={MESSAGES.editableFields}
                    options={editableFieldsOptions(formatMessage)}
                />
            )}
            {values?.editableFields && values.editableFields.includes('possibleTypeIds') && (
                <InputComponent
                    type="select"
                    multi
                    keyValue="possibleTypeIds"
                    onChange={onChange}
                    value={values.possibleTypeIds}
                    errors={getErrors('possibleTypeIds')}
                    label={MESSAGES.possibleTypeIds}
                    options={orgUnitTypeOptions}
                />
            )}
            {values?.editableFields && values.editableFields.includes('possibleParentTypeIds') && (
                <InputComponent
                    type="select"
                    multi
                    keyValue="possibleParentTypeIds"
                    onChange={onChange}
                    value={values.possibleParentTypeIds}
                    errors={getErrors('possibleParentTypeIds')}
                    label={MESSAGES.possibleParentTypeIds}
                    options={orgUnitTypeOptions} // Warning: we should probably filter data here (only what is available in parent/child relationship)
                />
            )}
            {values?.editableFields && values.editableFields.includes('groupSetIds') && (
                <InputComponent
                    type="select"
                    multi
                    keyValue="groupSetIds"
                    onChange={onChange}
                    value={values.groupSetIds}
                    errors={getErrors('groupSetIds')}
                    label={MESSAGES.groupSetIds}
                    options={groupSetOptions} // Warning: no call for groupsets ATM (using groups as placeholder)
                />
            )}
            {values?.editableFields && values.editableFields.includes('editableReferenceFormIds') && (
                <InputComponent
                    type="select"
                    multi
                    keyValue="editableReferenceFormIds"
                    onChange={onChange}
                    value={values.editableReferenceFormIds}
                    errors={getErrors('editableReferenceFormIds')}
                    label={MESSAGES.editableReferenceFormIds}
                    options={formOptions}
                />
            )}
            {values?.editableFields && values.editableFields.includes('otherGroupIds') && (
                <InputComponent
                    type="select"
                    multi
                    keyValue="otherGroupIds"
                    onChange={onChange}
                    value={values.otherGroupIds}
                    errors={getErrors('otherGroupIds')}
                    label={MESSAGES.otherGroupIds}
                    options={groupOptions} // Warning: we should probably filter data here (not in groupsets)
                />
            )}
        </ConfirmCancelModal>
    );
};

const modalWithButton = makeFullModal(
    OrgUnitChangeRequestConfigDialogUpdate,
    EditIconButton,
);

export {
    modalWithButton as OrgUnitChangeRequestConfigDialogUpdate,
    OrgUnitChangeRequestConfigDialogUpdate as OrgUnitChangeRequestConfigDialogCreateSecondStep,
};
