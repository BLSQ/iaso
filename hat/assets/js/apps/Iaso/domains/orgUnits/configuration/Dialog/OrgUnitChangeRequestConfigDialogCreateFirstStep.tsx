import React, { FunctionComponent, useCallback } from 'react';
import {
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
    AddButton,
} from 'bluesquare-components';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { useTranslatedErrors } from '../../../../libs/validation';
import MESSAGES from '../messages';
import { useGetProjectsDropdownOptions } from '../../../projects/hooks/requests';
import InputComponent from '../../../../components/forms/InputComponent';
import {
    useGetOUCRCCheckAvailabilityDropdownOptions,
} from '../hooks/api/useGetOUCRCCheckAvailabilityDropdownOptions';
import { isEqual } from 'lodash';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    // eslint-disable-next-line no-unused-vars
    openCreationSecondStepDialog: (config: object) => void;
};

const useCreationSchema = () => {
    const { formatMessage } = useSafeIntl();
    return Yup.object().shape({
        projectId: Yup.string().nullable().required(formatMessage(MESSAGES.requiredField)),
        // orgUnitTypeId: Yup.string().nullable().required(formatMessage(MESSAGES.requiredField)),
        orgUnitTypeId: Yup.string().nullable(),
    });
};

const OrgUnitChangeRequestConfigDialogCreateFirstStep: FunctionComponent<Props> = ({
                                                                                       isOpen,
                                                                                       closeDialog,
                                                                                       openCreationSecondStepDialog,
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
            projectId: undefined,
            orgUnitTypeId: undefined,
        },
        validationSchema: creationSchema,
        onSubmit: () => {
            const projectOption = allProjects?.find(project =>
                project.id === values.projectId,
            );
            const orgUnitTypeOption = orgUnitTypeOptions?.find(orgUnitType =>
                orgUnitType.id === values.orgUnitTypeId,
            );
            openCreationSecondStepDialog({
                project: projectOption ? {
                    id: projectOption.value,
                    name: projectOption.label,
                } : undefined,
                orgUnitType: orgUnitTypeOption ? {
                    id: orgUnitTypeOption.value,
                    name: orgUnitTypeOption.label,
                } : undefined,
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

    const { data: allProjects, isFetching: isFetchingProjects } = useGetProjectsDropdownOptions();
    const {
        data: orgUnitTypeOptions,
        isFetching: isFetchingOrgUnitTypes,
    } = useGetOUCRCCheckAvailabilityDropdownOptions(values.projectId);

    const onChange = useCallback(
        (keyValue, value) => {
            setFieldTouched(keyValue, true);
            setFieldValue(keyValue, value);
        },
        [setFieldValue, setFieldTouched],
    );

    // const allowConfirm = isValid && !isSubmitting && !isEqual(touched, {});
    const allowConfirm = true;

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
                disabled={isFetchingOrgUnitTypes || !values.projectId}
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
