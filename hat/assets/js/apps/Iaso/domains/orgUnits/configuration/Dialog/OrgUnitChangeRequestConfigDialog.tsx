import React, { FunctionComponent, useCallback, useState } from 'react';
import {
    SimpleModal,
    IntlMessage,
    makeFullModal,
    useSafeIntl,
    AddButton,
} from 'bluesquare-components';
import { Button } from '@mui/material';
import MESSAGES from '../messages';
import { OrgUnitChangeRequestConfigurationFull } from '../types';
import { useGetProjectsDropdownOptions } from '../../../projects/hooks/requests';
import InputComponent from '../../../../components/forms/InputComponent';
import { formatLabel } from '../../../instances/utils';
import { useFormState } from '../../../../hooks/form';
import { OrgunitType } from '../../types/orgunitTypes';
import { commaSeparatedIdsToArray, isFieldValid } from '../../../../utils/forms';
import { requiredFields } from '../../orgUnitTypes/config/requiredFields';
import {
    useCheckAvailabilityOrgUnitChangeRequestConfigs
} from '../hooks/api/useCheckAvailabilityOrgUnitChangeRequestConfigs';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { getRangeValues, getScaleThreshold } from '../../../../components/LegendBuilder/utils';
import { useTranslatedErrors } from '../../../../libs/validation';
import messages from '../messages';

type CancelButtonProps = {
    closeDialog: () => void;
};

const CloseButton: FunctionComponent<CancelButtonProps> = ({ closeDialog }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Button
            onClick={() => {
                closeDialog();
            }}
            color="primary"
            data-test="cancel-button"
        >
            {formatMessage(MESSAGES.close)}
        </Button>
    );
};

type Props = {
    titleMessage: IntlMessage;
    isOpen: boolean;
    closeDialog: () => void;
    // config?: OrgUnitChangeRequestConfigurationFull;
};

const defaultOrgUnitChangeRequestConfig: Omit<
    OrgUnitChangeRequestConfigurationFull,
    'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
> & {
    id: undefined;
} = {
    id: undefined,
    project: undefined,
    org_unit_type: undefined,
};

const mapConfigForCreation = orgUnitChangeRequestConfig => {
    return {
        project_id: orgUnitChangeRequestConfig.project.id,
        org_unit_type_id: orgUnitChangeRequestConfig.org_unit_type.id,
        org_units_editable: orgUnitChangeRequestConfig.org_units_editable,
        editable_fields: orgUnitChangeRequestConfig.editable_fields,
        possible_type_ids: orgUnitChangeRequestConfig.possible_type_ids.map(type => type.id),
        possible_parent_type_ids: orgUnitChangeRequestConfig.possible_parent_type_ids.map(type => type.id),
        group_set_ids: orgUnitChangeRequestConfig.group_sets.map(group_set => group_set.id),
        editable_reference_form_ids: orgUnitChangeRequestConfig.editable_reference_forms.map(form => form.id),
        other_group_ids: orgUnitChangeRequestConfig.other_groups.map(group => group.id),
    };
};

const mapConfigForUpdate = orgUnitChangeRequestConfig => {
    return {
        org_units_editable: orgUnitChangeRequestConfig.org_units_editable,
        editable_fields: orgUnitChangeRequestConfig.editable_fields,
        possible_type_ids: orgUnitChangeRequestConfig.possible_type_ids.map(type => type.id),
        possible_parent_type_ids: orgUnitChangeRequestConfig.possible_parent_type_ids.map(type => type.id),
        group_set_ids: orgUnitChangeRequestConfig.group_sets.map(group_set => group_set.id),
        editable_reference_form_ids: orgUnitChangeRequestConfig.editable_reference_forms.map(form => form.id),
        other_group_ids: orgUnitChangeRequestConfig.other_groups.map(group => group.id),
    };
};

const useCreationSchema = () => {
    const { formatMessage } = useSafeIntl();
    return Yup.object().shape({
        projectId: Yup.string().nullable().required(formatMessage(MESSAGES.requiredField)),
        orgUnitTypeId: Yup.string().nullable().required(formatMessage(MESSAGES.requiredField)),
    });
};

const OrgUnitChangeRequestConfigDialog: FunctionComponent<Props> = ({
    titleMessage,
    isOpen,
    closeDialog,
}) => {

    const creationSchema = useCreationSchema();
    const {
        values,
        setFieldValue,
        setFieldError,
        isValid,
        handleSubmit,
        errors,
        touched,
        setFieldTouched,
    } = useFormik({
        initialValues: {
            projectId: undefined,
            orgUnitTypeId: undefined,
        },
        validationSchema: creationSchema,
        onSubmit: () => {
            console.log("*** onSubmit values = ", values);
        },
    });

    const { formatMessage } = useSafeIntl();
    const getErrors = useTranslatedErrors({
        errors,
        touched,
        formatMessage,
        messages: MESSAGES,
    });


    const { data: allProjects, isFetching: isFetchingProjects } = useGetProjectsDropdownOptions();
    const { data: availableOrgUnitTypes, isFetching: isFetchingOrgUnitTypes } = useCheckAvailabilityOrgUnitChangeRequestConfigs(formState.project.id);

    const onChange = useCallback(
        (keyValue, value) => {
            setFieldTouched(keyValue, true);
            if (
                keyValue === 'possible_type_ids' ||
                keyValue === 'possible_parent_type_ids' ||
                keyValue === 'group_set_ids' ||
                keyValue === 'editable_reference_form_ids' ||
                keyValue === 'other_group_ids'
            ) {
                setFieldValue(keyValue, commaSeparatedIdsToArray(value));
            } else {
                setFieldValue(keyValue, value);
            }
        },
        [setFieldValue, formatMessage],
    );

    console.log("*** render values = ", values);

    return (
        <SimpleModal
            buttons={CloseButton}
            open={isOpen}
            onClose={() => null}
            id="PaymentLotEditionDialog"
            dataTestId="PaymentLotEditionDialog"
            titleMessage={titleMessage}
            closeDialog={closeDialog}
            maxWidth="md"
        >
            <InputComponent
                type="select"
                required
                disabled={isFetchingProjects}
                keyValue="projectId"
                onChange={onChange}
                value={values.projectId}
                label={MESSAGES.project}
                options={allProjects}
                errors={getErrors('projectId')}
            />
            <InputComponent
                type="select"
                required
                disabled={isFetchingOrgUnitTypes}
                keyValue="orgUnitTypeId"
                onChange={onChange}
                value={values.orgUnitTypeId}
                label={MESSAGES.orgUnitType}
                options={availableOrgUnitTypes || []}
                errors={getErrors('orgUnitTypeId')}
            />
        </SimpleModal>
    );
};

const modalWithButton = makeFullModal(
    OrgUnitChangeRequestConfigDialog,
    AddButton,
);

export { modalWithButton as OrgUnitChangeRequestConfigDialog };
