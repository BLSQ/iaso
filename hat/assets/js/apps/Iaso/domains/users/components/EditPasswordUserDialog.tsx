import React, { FunctionComponent } from 'react';
import PasswordIcon from '@mui/icons-material/Password';
import { Button } from '@mui/material';
import {
    ConfirmCancelModal,
    IntlMessage,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { FormikProps, FormikProvider, useFormik } from 'formik';
import { UseMutateFunction } from 'react-query';
import { EditButton } from 'Iaso/components/Buttons/EditButton';
import InputComponent from 'Iaso/components/forms/InputComponent';
import MESSAGES from 'Iaso/domains/users/messages';
import { SaveUserPasswordQuery } from 'Iaso/domains/users/types';
import { useUserPasswordValidation } from 'Iaso/domains/users/validation';
import {
    useApiErrorValidation,
    useTranslatedErrors,
} from 'Iaso/libs/validation';
import { DjangoError } from 'Iaso/types/general';
import { User } from 'Iaso/utils/usersUtils';

type Props = {
    titleMessage: IntlMessage;
    savePassword: UseMutateFunction<
        User,
        DjangoError,
        User | Partial<User>,
        unknown
    >;
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

    const onChange = (keyValue: string, value: string) => {
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
    }: FormikProps<Partial<SaveUserPasswordQuery>> = formik;

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
                maxWidth="sm"
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
                        label={MESSAGES.passwordLabel}
                    />
                    <InputComponent
                        keyValue="confirm_password"
                        onChange={onChange}
                        value={values.confirm_password}
                        errors={getErrors('confirm_password')}
                        required
                        type="password"
                        label={MESSAGES.confirmPasswordLabel}
                    />
                </div>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

type PasswordEditButtonProps = Omit<
    React.ComponentProps<typeof EditButton>,
    'message' | 'color'
>;

const PasswordEditButton = (props: PasswordEditButtonProps) => {
    const extendedProps = {
        ...props,
        sx: {
            color: 'white',
        },
    };
    const { formatMessage } = useSafeIntl();
    return (
        <Button variant={'contained'} color={'warning'} {...extendedProps}>
            <PasswordIcon sx={{ mr: 1 }} />
            {formatMessage(MESSAGES.updatePasswordButtonLabel)}
        </Button>
    );
};

export const modalWithButton = makeFullModal(
    EditPasswordUserDialogComponent,
    PasswordEditButton,
);

export { modalWithButton as EditPasswordUserWithButtonDialog };
