import React, { FunctionComponent } from 'react';
import {
    ConfirmCancelModal,
    IntlMessage,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { FormikProvider, useFormik } from 'formik';
import { MutateFunction } from 'react-query';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { EditButton } from 'Iaso/domains/users/components/EditButton';
import MESSAGES from 'Iaso/domains/users/messages';
import { SaveUserPasswordQuery } from 'Iaso/domains/users/types';
import { useUserPasswordValidation } from 'Iaso/domains/users/validation';
import {
    useApiErrorValidation,
    useTranslatedErrors,
} from 'Iaso/libs/validation';
import { Profile } from 'Iaso/utils/usersUtils';

type Props = {
    titleMessage: IntlMessage;
    savePassword: MutateFunction<Profile, any>;
    closeDialog: () => void;
    isOpen: boolean;
};

const EditPasswordUserDialogComponent: FunctionComponent<Props> = ({
    titleMessage,
    isOpen,
    closeDialog,
    savePassword,
}) => {
    const { formatMessage } = useSafeIntl();

    const {
        apiErrors,
        payload,
        mutation: save,
    } = useApiErrorValidation<Partial<SaveUserPasswordQuery>, any>({
        mutationFn: savePassword,
        onSuccess: () => {
            closeDialog();
            formik.resetForm();
        },
    });

    const schema = useUserPasswordValidation(apiErrors, payload);

    const formik = useFormik({
        initialValues: {},
        enableReinitialize: true,
        onSubmit: save,
        validationSchema: schema,
    });

    const onChange = (keyValue, value) => {
        setFieldTouched(keyValue, true);
        setFieldValue(keyValue, value);
    };

    const {
        values,
        setFieldValue,
        touched,
        setFieldTouched,
        errors,
        isValid,
        handleSubmit,
        resetForm,
    } = formik;

    console.log(apiErrors, errors);

    const getErrors = useTranslatedErrors({
        errors,
        formatMessage,
        touched,
        messages: MESSAGES,
    });

    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                titleMessage={titleMessage}
                onConfirm={handleSubmit}
                onCancel={() => {
                    resetForm();
                    closeDialog();
                }}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
                maxWidth="md"
                open={isOpen}
                closeDialog={closeDialog}
                allowConfirm={isValid}
                onClose={() => resetForm()}
                id="update-user-password-dialog"
                dataTestId="update-user-password-dialog"
                closeOnConfirm={false}
            >
                <div>
                    <InputComponent
                        keyValue="password"
                        onChange={onChange}
                        value={values.password}
                        errors={getErrors('password')}
                        required
                        type="password"
                        label={{
                            defaultMessage: 'Password',
                            id: 'iaso.users.dialog.updatePassword.fields.confirmPassword',
                        }}
                    />
                    <InputComponent
                        keyValue="confirm_password"
                        onChange={onChange}
                        value={values.confirm_password}
                        errors={getErrors('confirm_password')}
                        required
                        type="password"
                        label={{
                            defaultMessage: 'Confirm password',
                            id: 'iaso.users.dialog.updatePassword.fields.confirmPassword',
                        }}
                    />
                </div>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

const PasswordEditButton = props => {
    return (
        <EditButton
            message={{
                defaultMessage: 'Update password',
                id: 'iaso.users.dialog.updatePassword',
            }}
            {...props}
        />
    );
};

export const modalWithButton = makeFullModal(
    EditPasswordUserDialogComponent,
    PasswordEditButton,
);

export { modalWithButton as EditPasswordUserWithButtonDialog };
