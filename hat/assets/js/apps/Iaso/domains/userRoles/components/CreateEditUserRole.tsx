import React, { FunctionComponent, useState } from 'react';
import { useFormik, FormikProvider } from 'formik';
import {
    AddButton,
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
} from 'bluesquare-components';
import { isEqual } from 'lodash';
import {
    SaveUserRoleQuery,
    useSaveUserRole,
} from '../hooks/requests/useSaveUserRole';
import MESSAGES from '../messages';
import { useUserRoleValidation } from '../validation';
import {
    useApiErrorValidation,
    useTranslatedErrors,
} from '../../../libs/validation';
import InputComponent from '../../../components/forms/InputComponent';
import { PermissionsSwitches } from './PermissionsSwitches';
import { Permission } from '../types/userRoles';
import { EditIconButton } from '../../users/components/UsersDialog';

type ModalMode = 'create' | 'edit';
type Props = Partial<SaveUserRoleQuery> & {
    dialogType: ModalMode;
    closeDialog: () => void;
    isOpen: boolean;
    id?: string;
};

export const CreateEditUserRole: FunctionComponent<Props> = ({
    dialogType = 'create',
    closeDialog,
    isOpen,
    id,
    name,
    permissions = [],
}) => {
    const [userRolePermissions, setUserRolePermissoins] =
        useState<Permission[]>(permissions);
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: saveUserRole } = useSaveUserRole(dialogType);
    const {
        apiErrors,
        payload,
        mutation: save,
    } = useApiErrorValidation<Partial<SaveUserRoleQuery>, any>({
        mutationFn: saveUserRole,
        onSuccess: () => {
            closeDialog();
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

    const {
        values,
        setFieldValue,
        touched,
        setFieldTouched,
        errors,
        isValid,
        initialValues,
        handleSubmit,
        resetForm,
    } = formik;

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

    const titleMessage =
        dialogType === 'create'
            ? formatMessage(MESSAGES.createUserRole)
            : formatMessage(MESSAGES.editUserRole);
    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                allowConfirm={isValid && !isEqual(values, initialValues)}
                titleMessage={titleMessage}
                onConfirm={() => {
                    handleSubmit();
                }}
                onCancel={() => {
                    resetForm();
                }}
                maxWidth="sm"
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
                open={isOpen}
                closeDialog={closeDialog}
                id={id ?? ''}
                dataTestId="Test-modal"
                onClose={() => null}
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
                    handleChange={newPermissions => {
                        setUserRolePermissoins(newPermissions);
                        setFieldValue('permissions', newPermissions);
                    }}
                />
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

const createUserRoleModalWithButton = makeFullModal(
    CreateEditUserRole,
    AddButton,
);
const editUserRoleModalWithIcon = makeFullModal(
    CreateEditUserRole,
    EditIconButton,
);

export {
    createUserRoleModalWithButton as CreateUserRoleDialog,
    editUserRoleModalWithIcon as EditUserRoleDialog,
};
