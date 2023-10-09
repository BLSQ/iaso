import React, { FunctionComponent, useCallback } from 'react';
import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
    AddButton,
} from 'bluesquare-components';
import { Box, Divider } from '@material-ui/core';
import { FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';
import MESSAGES from '../../../../constants/messages';
import { EditIconButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';
import {
    useApiErrorValidation,
    useTranslatedErrors,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/validation';
import { APP_LOCALES } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/app/constants';
import { useCreateEditReasonForDelay } from '../hooks/requests';
import { useReasonsForDelayValidation } from '../hooks/validation';
import InputComponent from '../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    id?: number;
    keyName?: string;
    nameEn?: string;
    nameFr?: string;
};
// Workaround to avoid TS error with onCancel prop
const noOp = () => null;
const CreateEditReasonForDelay: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    id,
    keyName,
    nameEn,
    nameFr,
}) => {
    const { formatMessage } = useSafeIntl();

    const { mutateAsync: saveReason } = useCreateEditReasonForDelay();
    const {
        apiErrors,
        payload,

        mutation: save,
    } = useApiErrorValidation<Partial<any>, any>({
        mutationFn: saveReason,
        // eslint-disable-next-line no-unused-vars
        onSuccess: _ => {
            closeDialog();
            formik.resetForm();
        },
    });
    // TODO add validation schema
    const validationSchema = useReasonsForDelayValidation(apiErrors, payload);

    const formik = useFormik<any>({
        initialValues: {
            id,
            key_name: keyName,
            name_en: nameEn,
            name_fr: nameFr,
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema,
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

    const onChange = useCallback(
        (keyValue, value) => {
            setFieldTouched(keyValue, true);
            setFieldValue(keyValue, value);
        },
        [setFieldTouched, setFieldValue],
    );
    const getErrors = useTranslatedErrors({
        errors,
        formatMessage,
        touched,
        messages: MESSAGES,
    });
    const titleMessage = id
        ? formatMessage(MESSAGES.editReasonForDelay)
        : formatMessage(MESSAGES.createReasonForDelay);
    const allowConfirm = isValid && !isEqual(values, initialValues);
    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                id="reasonForDelay-Modal"
                dataTestId="reasonForDelay-Modal"
                open={isOpen}
                closeDialog={closeDialog}
                titleMessage={titleMessage}
                onConfirm={handleSubmit}
                onCancel={noOp}
                onClose={() => resetForm()}
                confirmMessage={MESSAGES.confirm}
                cancelMessage={MESSAGES.cancel}
                allowConfirm={allowConfirm}
                closeOnConfirm={false}
            >
                <Divider />
                <Box mt={2}>
                    <InputComponent
                        keyValue="key_name"
                        onChange={onChange}
                        value={values.key_name}
                        errors={getErrors('key_name')}
                        type="text"
                        label={MESSAGES.keyName}
                        required
                        disabled={Boolean(id)}
                    />
                </Box>
                {APP_LOCALES.sort((a, b) =>
                    a.code.localeCompare(b.code, undefined, {
                        sensitivity: 'accent',
                    }),
                ).map(locale => {
                    const key = `name_${locale.code}`;
                    return (
                        <Box mt={2} key={key}>
                            <InputComponent
                                keyValue={key}
                                onChange={onChange}
                                value={values[key]}
                                errors={getErrors(key)}
                                type="text"
                                label={MESSAGES[key]}
                                required={locale.code === 'en'}
                            />
                        </Box>
                    );
                })}
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

const createReasonForDelay = makeFullModal(CreateEditReasonForDelay, AddButton);
const editReasonForDelay = makeFullModal(
    CreateEditReasonForDelay,
    EditIconButton,
);

export {
    createReasonForDelay as CreateReasonForDelay,
    editReasonForDelay as EditReasonForDelay,
};
