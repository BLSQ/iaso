import React, { FunctionComponent, useMemo, useState } from 'react';
import { useFormik, FormikProvider } from 'formik';
import { AddButton, IconButton, useSafeIntl } from 'bluesquare-components';
import { isEqual } from 'lodash';
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
import { PermissionsSwitches } from './PermissionsSwitches';

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

export const CreateEditUserRole: FunctionComponent<Props> = ({
    dialogType = 'create',
    id,
    name,
    permissions = [],
}) => {
    const [userRolePermissions, setUserRolePermissoins] =
        useState<Array<any>>(permissions);
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
            setUserRolePermissoins([]);
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
            {/* @ts-ignore */}
            <ConfirmCancelDialogComponent
                allowConfirm={isValid && !isEqual(values, initialValues)}
                renderTrigger={renderTrigger}
                titleMessage={titleMessage}
                onConfirm={closeDialog => {
                    handleSubmit();
                    setCloseModal({ closeDialog });
                }}
                onCancel={closeDialog => {
                    closeDialog();
                    setUserRolePermissoins([]);
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
                    handleChange={newPermissions => {
                        setUserRolePermissoins(newPermissions);
                        setFieldValue('permissions', newPermissions);
                    }}
                />
            </ConfirmCancelDialogComponent>
        </FormikProvider>
    );
};
