import React, { FunctionComponent, useCallback } from 'react';
import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { useFormik } from 'formik';
import { isEqual } from 'lodash';
import * as Yup from 'yup';
import InputComponent from '../../../../components/forms/InputComponent';
import { useTranslatedErrors } from '../../../../libs/validation';
import { useGetProjectsDropdownOptions } from '../../../projects/hooks/requests';
import { useGetOUCRCCheckAvailabilityDropdownOptions } from '../hooks/api/useGetOUCRCCheckAvailabilityDropdownOptions';
import { useOrgUnitConfigurationTypes } from '../hooks/useOrgUnitConfigurationTypes';
import MESSAGES from '../messages';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    openCreationSecondStepDialog: (config: object) => void;
};

const useCreationSchema = () => {
    const { formatMessage } = useSafeIntl();
    return Yup.object().shape({
        projectId: Yup.string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        type: Yup.string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        orgUnitTypeId: Yup.string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
    });
};

const OrgUnitChangeRequestConfigDialogCreateFirstStep: FunctionComponent<
    Props
> = ({ isOpen, closeDialog, openCreationSecondStepDialog }) => {
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
            projectId: undefined,
            type: undefined,
            orgUnitTypeId: undefined,
        },
        validationSchema: creationSchema,
        onSubmit: () => {
            const projectOption = allProjects?.find(
                project => `${project.value}` === `${values.projectId}`,
            );
            const orgUnitTypeOption = orgUnitTypeOptions?.find(
                orgUnitType =>
                    `${orgUnitType.value}` === `${values.orgUnitTypeId}`,
            );
            openCreationSecondStepDialog({
                project: projectOption
                    ? {
                          id: projectOption.value,
                          name: projectOption.label,
                      }
                    : undefined,
                type: values.type,
                orgUnitType: orgUnitTypeOption
                    ? {
                          id: orgUnitTypeOption.value,
                          name: orgUnitTypeOption.label,
                      }
                    : undefined,
            });
        },
    });

    const { formatMessage } = useSafeIntl();
    const getErrors = useTranslatedErrors({
        errors,
        touched,
        formatMessage,
        messages: MESSAGES,
    });

    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions(false);
    const { data: orgUnitTypeOptions, isFetching: isFetchingOrgUnitTypes } =
        useGetOUCRCCheckAvailabilityDropdownOptions(
            values.projectId,
            values.type,
        );
    const types = useOrgUnitConfigurationTypes();

    const onChange = useCallback(
        (keyValue, value) => {
            setFieldTouched(keyValue, true);
            setFieldValue(keyValue, value);
        },
        [setFieldValue, setFieldTouched],
    );

    const allowConfirm = isValid && !isSubmitting && !isEqual(touched, {});

    return (
        <ConfirmCancelModal
            open={isOpen}
            onClose={() => null}
            id="oucrcDialogCreate"
            dataTestId="add-org-unit-config-button"
            titleMessage={formatMessage(MESSAGES.oucrcCreateModalTitle)}
            closeDialog={closeDialog}
            maxWidth="xs"
            allowConfirm={allowConfirm}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.next}
            onConfirm={() => handleSubmit()}
            onCancel={() => {
                closeDialog();
            }}
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
                keyValue="type"
                onChange={onChange}
                value={values.type}
                label={MESSAGES.type}
                options={types}
                errors={getErrors('type')}
            />
            <InputComponent
                type="select"
                required
                disabled={
                    isFetchingOrgUnitTypes || !values.projectId || !values.type
                }
                keyValue="orgUnitTypeId"
                onChange={onChange}
                value={values.orgUnitTypeId}
                label={MESSAGES.orgUnitType}
                options={orgUnitTypeOptions || []}
                errors={getErrors('orgUnitTypeId')}
            />
        </ConfirmCancelModal>
    );
};

const modalWithButton = makeFullModal(
    OrgUnitChangeRequestConfigDialogCreateFirstStep,
    AddButton,
);

export { modalWithButton as OrgUnitChangeRequestConfigDialogCreateFirstStep };
