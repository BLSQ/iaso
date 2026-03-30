import React, { useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import {
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { SingleSelect } from 'Iaso/domains/pages/components/SingleSelect';
import MESSAGES from '../../messages';
import { useNodeValidationSchema } from './useNodeValidationSchema';
import { useSaveNode } from './useSaveNode';
import { ValidateButton } from './ValidateButton';

const useApprovalOptions = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            { label: formatMessage(MESSAGES.approve), value: 'true' },
            { label: formatMessage(MESSAGES.rejected), value: 'false' },
        ],
        [formatMessage],
    );
};

type Props = {
    instanceId: number;
    nodeId?: number;
    nodeSlug?: string;
    closeDialog: () => void;
    isOpen: boolean;
};

export const ValidationModal = ({
    instanceId,
    nodeId,
    nodeSlug,
    closeDialog,
    isOpen,
}: Props) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: save } = useSaveNode({ instanceId, nodeId });
    const validationSchema = useNodeValidationSchema();
    const formik = useFormik<{
        approved: boolean;
        comment?: string;
        node?: string;
    }>({
        initialValues: {
            approved: false,
            comment: '',
            node: nodeSlug,
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema,
        onSubmit: values => save(values),
    });
    const approvalOptions = useApprovalOptions();
    const onChange = useCallback(
        (keyValue: string, value: any) => {
            formik.setFieldTouched(keyValue, true);
            formik.setFieldValue(keyValue, value);
        },
        [formik],
    );

    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                open={isOpen}
                id={'confirm-node'}
                dataTestId={'confirm-node'}
                closeDialog={closeDialog}
                confirmMessage={MESSAGES.save}
                cancelMessage={MESSAGES.cancel}
                titleMessage={MESSAGES.validateSubmission}
                onConfirm={() => formik.handleSubmit()}
                onCancel={() => formik.resetForm()}
                onClose={() => null}
                maxWidth="md"
            >
                <Box>
                    <Field
                        label={formatMessage(MESSAGES.approve)}
                        name="approved"
                        component={SingleSelect}
                        withMarginTop
                        options={approvalOptions}
                        required
                    />
                    <InputComponent
                        keyValue="comment"
                        type="textarea"
                        labelString={formatMessage(MESSAGES.comment)}
                        onChange={onChange}
                        withMarginTop
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithButton = makeFullModal(ValidationModal, ValidateButton);
export { modalWithButton as ValidateNodeModal };
