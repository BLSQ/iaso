import React, { FunctionComponent, useMemo, useState } from 'react';
import { useFormik, FormikProvider } from 'formik';
import {
    AddButton,
    IconButton,
    IntlFormatMessage,
    useSafeIntl,
} from 'bluesquare-components';
import {
    SaveUserRoleQuery,
    useSaveUserRole,
} from '../hooks/requests/useSaveUserRole';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import MESSAGES from '../messages';
import { useUserRoleValidation } from '../validation';
import {
    useApiErrorValidation,
    useTranslatedErrors,
} from '../../../libs/validation';
import InputComponent from '../../../components/forms/InputComponent';
import PermissionsSwitches from './PermissionsSwitches';

type ModalMode = 'create' | 'edit';
type Props = Partial<SaveUserRoleQuery> & {
    dialogType: ModalMode;
};
const makeRenderTrigger = (dialogType: 'create' | 'edit') => {
    if (dialogType === 'create') {
        return ({ openDialog }) => (
            <AddButton
                dataTestId="create-plannning-button"
                onClick={openDialog}
            />
        );
    }
    return ({ openDialog }) => (
        <IconButton
            onClick={openDialog}
            icon="edit"
            tooltipMessage={MESSAGES.edit}
        />
    );
};
const formatTitle = (
    dialogType: ModalMode,
    formatMessage: IntlFormatMessage,
) => {
    switch (dialogType) {
        case 'create':
            return formatMessage(MESSAGES.createUserRole);
        case 'edit':
            return formatMessage(MESSAGES.editUserRole);
        default:
            return formatMessage(MESSAGES.createUserRole);
    }
};
export const CreateEditUserRole: FunctionComponent<Props> = ({
    dialogType,
    id,
    name,
    permissions = [],
}) => {
    const userRolePermissions = permissions;
    const { formatMessage } = useSafeIntl();
    const [closeModal, setCloseModal] = useState<any>();
    const renderTrigger = useMemo(
        () => makeRenderTrigger(dialogType),
        [dialogType],
    );
    const { mutateAsync: saveUserRole } = useSaveUserRole(dialogType);
    const {
        apiErrors,
        payload,
        mutation: save,
    } = useApiErrorValidation<Partial<SaveUserRoleQuery>, any>({
        mutationFn: saveUserRole,
        onSuccess: () => {
            closeModal.closeDialog();
            formik.resetForm();
        },
    });
    const schema = useUserRoleValidation(apiErrors, payload);
    const formik = useFormik({
        initialValues: {
            id,
            name,
            permissions,
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: save,
    });

    const { values, setFieldValue, setFieldTouched, errors, touched } = formik;
    const getErrors = useTranslatedErrors({
        errors,
        formatMessage,
        touched,
        messages: MESSAGES,
    });
    const onChange = (keyValue, value) => {
        setFieldTouched(keyValue, true);
        setFieldValue(keyValue, value);
    };
    const titleMessage = formatTitle(dialogType, formatMessage);
    return (
        <FormikProvider value={formik}>
            {/* @ts-ignore */}
            <ConfirmCancelDialogComponent
                renderTrigger={renderTrigger}
                titleMessage={titleMessage}
                onConfirm={closeDialog => {
                    setCloseModal({ closeDialog });
                    closeDialog();
                }}
                onCancel={closeDialog => {
                    closeDialog();
                }}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
            >
                <InputComponent
                    keyValue="name"
                    onChange={onChange}
                    value={values.name}
                    errors={getErrors('name')}
                    type="text"
                    label={MESSAGES.name}
                    required
                />
                <PermissionsSwitches
                    userRolePermissions={userRolePermissions}
                    handleChange={() =>
                        setFieldValue('permissions', userRolePermissions)
                    }
                />
            </ConfirmCancelDialogComponent>
        </FormikProvider>
    );
};
