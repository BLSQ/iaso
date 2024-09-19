import React, { FunctionComponent, useCallback } from 'react';
import {
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { useTranslatedErrors } from '../../../../libs/validation';
import MESSAGES from '../messages';
import { useGetProjectsDropdownOptions } from '../../../projects/hooks/requests';
import { EditIconButton } from '../../../../components/Buttons/EditIconButton';
import InputComponent from '../../../../components/forms/InputComponent';
import {
    useCheckAvailabilityOrgUnitChangeRequestConfigs,
} from '../hooks/api/useCheckAvailabilityOrgUnitChangeRequestConfigs';
import { isEqual } from 'lodash';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
};

const useCreationSchema = () => {
    const { formatMessage } = useSafeIntl();
    return Yup.object().shape({
        projectId: Yup.string().nullable().required(formatMessage(MESSAGES.requiredField)),
        orgUnitTypeId: Yup.string().nullable().required(formatMessage(MESSAGES.requiredField)),
    });
};

const OrgUnitChangeRequestConfigDialogUpdate: FunctionComponent<Props> = ({
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
            projectId: undefined,
            orgUnitTypeId: undefined,
        },
        validationSchema: creationSchema,
        onSubmit: () => {
            console.log('*** onSubmit values = ', values);
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
        data: availableOrgUnitTypes,
        isFetching: isFetchingOrgUnitTypes,
    } = useCheckAvailabilityOrgUnitChangeRequestConfigs(values.projectId);

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
                disabled={isFetchingOrgUnitTypes || !values.projectId}
                keyValue="orgUnitTypeId"
                onChange={onChange}
                value={values.orgUnitTypeId}
                label={MESSAGES.orgUnitType}
                options={availableOrgUnitTypes || []}
                errors={getErrors('orgUnitTypeId')}
            />
        </ConfirmCancelModal>
    );
};

const modalWithButton = makeFullModal(
    OrgUnitChangeRequestConfigDialogUpdate,
    EditIconButton,
);

export { modalWithButton as OrgUnitChangeRequestConfigDialogUpdateWithButton, OrgUnitChangeRequestConfigDialogUpdate };
