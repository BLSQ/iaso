import React, { useCallback } from 'react';
import { Box } from '@mui/material';
import {
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { FormikProvider, useFormik } from 'formik';
import InputComponent from 'Iaso/components/forms/InputComponent';
import MESSAGES from '../../messages';
import {
    useNodeValidationApproveSchema,
    useNodeValidationRejectSchema,
} from './useNodeValidationSchema';
import { useCompleteNode, useCompleteNodeByPass } from './useSaveNode';
import { ValidateButton } from './ValidateButton';

type BaseModalProps = {
    instanceId: number;
    closeDialog: () => void;
    isOpen: boolean;
};
type ModalProps = BaseModalProps & {
    nodeId: number;
};

type ByPassModalProps = BaseModalProps & {
    nodeSlug: string;
};

export const ValidationApproveModal = ({
    instanceId,
    nodeId,
    closeDialog,
    isOpen,
}: ModalProps) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: save } = useCompleteNode({ instanceId, nodeId });

    const validationSchema = useNodeValidationApproveSchema();
    const formik = useFormik<{
        comment?: string;
        node?: string;
    }>({
        initialValues: {
            comment: '',
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema,
        onSubmit: values => save({ approved: true, ...values }),
    });
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
                id={'approve-node'}
                dataTestId={'approve-node'}
                closeDialog={closeDialog}
                confirmMessage={MESSAGES.save}
                cancelMessage={MESSAGES.cancel}
                titleMessage={MESSAGES.approve}
                onConfirm={() => formik.handleSubmit()}
                onCancel={() => formik.resetForm()}
                onClose={() => null}
                maxWidth="md"
            >
                <Box>
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
export const ValidationRejectModal = ({
    instanceId,
    nodeId,
    closeDialog,
    isOpen,
}: ModalProps) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: save } = useCompleteNode({ instanceId, nodeId });
    const validationSchema = useNodeValidationRejectSchema();
    const formik = useFormik<{
        comment?: string;
    }>({
        initialValues: {
            comment: '',
        },
        validateOnMount: true,
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema,
        onSubmit: values => save({ approved: false, ...values }),
    });
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
                allowConfirm={formik.isValid}
                open={isOpen}
                id={'reject-node'}
                dataTestId={'reject-node'}
                closeDialog={closeDialog}
                confirmMessage={MESSAGES.save}
                cancelMessage={MESSAGES.cancel}
                titleMessage={MESSAGES.reject}
                onConfirm={() => formik.handleSubmit()}
                onCancel={() => formik.resetForm()}
                onClose={() => null}
                maxWidth="md"
            >
                <Box>
                    <InputComponent
                        keyValue="comment"
                        type="textarea"
                        labelString={formatMessage(MESSAGES.comment)}
                        onChange={onChange}
                        withMarginTop
                        required
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

export const ValidationApproveByPassModal = ({
    instanceId,
    nodeSlug,
    closeDialog,
    isOpen,
}: ByPassModalProps) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: save } = useCompleteNodeByPass({ instanceId });

    const validationSchema = useNodeValidationApproveSchema();
    const formik = useFormik<{
        comment?: string;
    }>({
        initialValues: {
            comment: '',
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema,
        onSubmit: values => save({ approved: true, node: nodeSlug, ...values }),
    });
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
                id={'approve-bypass-node'}
                dataTestId={'approve-bypass-node'}
                closeDialog={closeDialog}
                confirmMessage={MESSAGES.save}
                cancelMessage={MESSAGES.cancel}
                titleMessage={MESSAGES.approve}
                onConfirm={() => formik.handleSubmit()}
                onCancel={() => formik.resetForm()}
                onClose={() => null}
                maxWidth="md"
            >
                <Box>
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
export const ValidationRejectByPassModal = ({
    instanceId,
    nodeSlug,
    closeDialog,
    isOpen,
}: ByPassModalProps) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: save } = useCompleteNodeByPass({ instanceId });
    const validationSchema = useNodeValidationRejectSchema();
    const formik = useFormik<{
        comment?: string;
    }>({
        initialValues: {
            comment: '',
        },
        validateOnMount: true,
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema,
        onSubmit: values =>
            save({ approved: false, node: nodeSlug, ...values }),
    });
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
                allowConfirm={formik.isValid}
                id={'reject-bypass-node'}
                dataTestId={'reject-bypass-node'}
                closeDialog={closeDialog}
                confirmMessage={MESSAGES.save}
                cancelMessage={MESSAGES.cancel}
                titleMessage={MESSAGES.reject}
                onConfirm={() => formik.handleSubmit()}
                onCancel={() => formik.resetForm()}
                onClose={() => null}
                maxWidth="md"
            >
                <Box>
                    <InputComponent
                        keyValue="comment"
                        type="textarea"
                        labelString={formatMessage(MESSAGES.comment)}
                        onChange={onChange}
                        withMarginTop
                        required
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

const modalRejectWithButton = makeFullModal(
    ValidationRejectModal,
    ValidateButton,
);
const modalApproveWithButton = makeFullModal(
    ValidationApproveModal,
    ValidateButton,
);

const modalRejectByPassWithButton = makeFullModal(
    ValidationRejectByPassModal,
    ValidateButton,
);
const modalApproveByPassWithButton = makeFullModal(
    ValidationApproveByPassModal,
    ValidateButton,
);

export {
    modalRejectWithButton as ValidateNodeRejectModal,
    modalApproveWithButton as ValidateNodeApproveModal,
    modalRejectByPassWithButton as ValidateNodeRejectByPassModal,
    modalApproveByPassWithButton as ValidateNodeApproveByPassModal,
};
