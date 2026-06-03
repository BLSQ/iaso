import React from 'react';
import { Alert, Box } from '@mui/material';
import {
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import {
    AccountUpdateAIApiKeyRequest,
    useApiAccountsAiApiKeyUpdate,
} from 'Iaso/api/accounts';
import { EditIconButton } from 'Iaso/components/Buttons/EditIconButton';
import PasswordInput from 'Iaso/components/forms/PasswordInput';
import MESSAGES from 'Iaso/domains/accounts/messages';
import { withFormikSubmitAsync } from 'Iaso/utils/forms';

type Props = {
    accountId: number;
    isOpen: boolean;
    closeDialog: () => void;
};

const EditAIApiKeyModal = ({ accountId, isOpen, closeDialog }: Props) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: saveAIApiKey } = useApiAccountsAiApiKeyUpdate({
        mutation: {
            ignoreErrorCodes: [400],
        },
    });
    const formik = useFormik({
        initialValues: {},
        validationSchema: toFormikValidationSchema(
            AccountUpdateAIApiKeyRequest,
        ),
        onSubmit: withFormikSubmitAsync(values =>
            saveAIApiKey({
                id: accountId,
                data: values as AccountUpdateAIApiKeyRequest,
            }),
        ),
    });

    const allowConfirm = formik.isValid && formik.dirty && !!accountId;

    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                titleMessage={formatMessage(MESSAGES.editAIApiKey)}
                onConfirm={() => formik.handleSubmit()}
                allowConfirm={allowConfirm}
                open={isOpen}
                closeDialog={closeDialog}
                id={`ai-api-key-${accountId}-modal`}
                dataTestId="ai-api-key-modal"
                onCancel={() => null}
                onClose={() => {
                    closeDialog();
                }}
                confirmMessage={MESSAGES.save}
                cancelMessage={MESSAGES.cancel}
            >
                <Box>
                    {formik.status && (
                        <Alert severity={'error'} sx={{ mb: 2 }}>
                            {formik.status}
                        </Alert>
                    )}
                    <Field
                        label={formatMessage(MESSAGES.aiApiKeyLabel)}
                        name={'anthropic_api_key'}
                        component={PasswordInput}
                        margin={'normal'}
                        required
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithIcon = makeFullModal(EditAIApiKeyModal, EditIconButton);
export { modalWithIcon as EditAIApiKey };
