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

type ValidationFormValues = {
    comment: string;
};

type BaseValidationModalProps = {
    isOpen: boolean;
    closeDialog: () => void;
    titleMessage: any;
    modalId: string;
    approved: boolean;
    requiredComment?: boolean;
    validationSchema: any;
    onSubmit: (values: ValidationFormValues) => Promise<unknown>;
};

const useValidationFormik = ({
    approved,
    validationSchema,
    onSubmit,
}: {
    approved: boolean;
    validationSchema: any;
    onSubmit: (values: ValidationFormValues) => Promise<unknown>;
}) => {
    return useFormik<ValidationFormValues>({
        initialValues: {
            comment: '',
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validateOnMount: !approved,
        validationSchema,
        onSubmit,
    });
};

const BaseValidationModal = ({
    isOpen,
    closeDialog,
    titleMessage,
    modalId,
    approved,
    requiredComment = false,
    validationSchema,
    onSubmit,
}: BaseValidationModalProps) => {
    const { formatMessage } = useSafeIntl();

    const formik = useValidationFormik({
        approved,
        validationSchema,
        onSubmit,
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
                allowConfirm={approved || formik.isValid}
                id={modalId}
                dataTestId={modalId}
                closeDialog={closeDialog}
                confirmMessage={MESSAGES.save}
                cancelMessage={MESSAGES.cancel}
                titleMessage={titleMessage}
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
                        required={requiredComment}
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

export const ValidationApproveModal = ({
    instanceId,
    nodeId,
    closeDialog,
    isOpen,
}: ModalProps) => {
    const validationSchema = useNodeValidationApproveSchema();

    const { mutateAsync: save } = useCompleteNode(instanceId, nodeId);

    return (
        <BaseValidationModal
            isOpen={isOpen}
            closeDialog={closeDialog}
            approved
            modalId="approve-node"
            titleMessage={MESSAGES.approve}
            validationSchema={validationSchema}
            onSubmit={values =>
                save({
                    approved: true,
                    ...values,
                })
            }
        />
    );
};

export const ValidationRejectModal = ({
    instanceId,
    nodeId,
    closeDialog,
    isOpen,
}: ModalProps) => {
    const validationSchema = useNodeValidationRejectSchema();

    const { mutateAsync: save } = useCompleteNode(instanceId, nodeId);

    return (
        <BaseValidationModal
            isOpen={isOpen}
            closeDialog={closeDialog}
            approved={false}
            requiredComment
            modalId="reject-node"
            titleMessage={MESSAGES.reject}
            validationSchema={validationSchema}
            onSubmit={values =>
                save({
                    approved: false,
                    ...values,
                })
            }
        />
    );
};

export const ValidationApproveByPassModal = ({
    instanceId,
    nodeSlug,
    closeDialog,
    isOpen,
}: ByPassModalProps) => {
    const validationSchema = useNodeValidationApproveSchema();

    const { mutateAsync: save } = useCompleteNodeByPass(instanceId);

    return (
        <BaseValidationModal
            isOpen={isOpen}
            closeDialog={closeDialog}
            approved
            modalId="approve-bypass-node"
            titleMessage={MESSAGES.approve}
            validationSchema={validationSchema}
            onSubmit={values =>
                save({
                    approved: true,
                    node: nodeSlug,
                    ...values,
                })
            }
        />
    );
};

export const ValidationRejectByPassModal = ({
    instanceId,
    nodeSlug,
    closeDialog,
    isOpen,
}: ByPassModalProps) => {
    const validationSchema = useNodeValidationRejectSchema();

    const { mutateAsync: save } = useCompleteNodeByPass(instanceId);

    return (
        <BaseValidationModal
            isOpen={isOpen}
            closeDialog={closeDialog}
            approved={false}
            requiredComment
            modalId="reject-bypass-node"
            titleMessage={MESSAGES.reject}
            validationSchema={validationSchema}
            onSubmit={values =>
                save({
                    approved: false,
                    node: nodeSlug,
                    ...values,
                })
            }
        />
    );
};

export const ValidateNodeRejectModal = makeFullModal(
    ValidationRejectModal,
    ValidateButton,
);

export const ValidateNodeApproveModal = makeFullModal(
    ValidationApproveModal,
    ValidateButton,
);

export const ValidateNodeRejectByPassModal = makeFullModal(
    ValidationRejectByPassModal,
    ValidateButton,
);

export const ValidateNodeApproveByPassModal = makeFullModal(
    ValidationApproveByPassModal,
    ValidateButton,
);
