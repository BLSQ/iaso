import React, { FunctionComponent } from 'react';
import AddLinkIcon from '@mui/icons-material/AddLink';
import { Box, Button, TextField } from '@mui/material';
import {
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { useFormik } from 'formik';
import { defineMessages } from 'react-intl';

import * as Yup from 'yup';

import { postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';

const MESSAGES = defineMessages({
    confirm: {
        id: 'iaso.label.confirm',
        defaultMessage: 'Confirm',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    targetEntityLabel: {
        id: 'iaso.duplicates.manual.targetLabel',
        defaultMessage: 'Target Entity ID or UUID',
    },
    buttonLabel: {
        id: 'iaso.duplicates.manual.button',
        defaultMessage: 'Add Duplicate',
    },
    title: {
        id: 'iaso.duplicates.manual.title',
        defaultMessage: 'Manually link duplicate',
    },
    success: {
        id: 'iaso.duplicates.manual.success',
        defaultMessage: 'Duplicate linked successfully, redirecting...',
    },
    error: {
        id: 'iaso.duplicates.manual.error',
        defaultMessage: 'Error linking duplicates',
    },
});

const validationSchema = Yup.object().shape({
    entity2_id: Yup.string().trim().required('Required'),
});

type ResponseData = {
    entity1_id: number;
    entity2_id: number;
};

type Props = {
    entityId: number;
    closeDialog: () => void;
    isOpen: boolean;
};

const ManualDuplicateModal: FunctionComponent<Props> = ({
    entityId,
    closeDialog,
    isOpen,
}) => {
    const { formatMessage } = useSafeIntl();

    const { mutate, isLoading, isError, error } = useSnackMutation<
        ResponseData,
        any, // Error type
        { entity1_id: number; entity2_id: string }
    >({
        mutationFn: data => postRequest('/api/entityduplicates/manual/', data),
        snackSuccessMessage: MESSAGES.success,
        snackErrorMsg: MESSAGES.error,
        options: {
            onSuccess: data => {
                // Redirect to the comparison page
                window.location.href = `/dashboard/entities/duplicates/details/entities/${data.entity1_id},${data.entity2_id}`;
            },
        },
    });

    const formik = useFormik({
        initialValues: {
            entity2_id: '',
        },
        validationSchema,
        onSubmit: values => {
            mutate({
                entity1_id: entityId,
                entity2_id: values.entity2_id,
            });
        },
    });

    const handleCancel = () => {
        formik.resetForm();
        closeDialog();
    };

    return (
        <ConfirmCancelModal
            titleMessage={MESSAGES.title}
            onConfirm={() => formik.handleSubmit()}
            onCancel={handleCancel}
            onClose={handleCancel}
            confirmMessage={MESSAGES.confirm}
            cancelMessage={MESSAGES.cancel}
            maxWidth="sm"
            open={isOpen}
            closeDialog={closeDialog}
            allowConfirm={formik.isValid && formik.dirty && !isLoading}
            id="manual-duplicate-modal"
        >
            <Box mt={2}>
                <TextField
                    fullWidth
                    id="entity2_id"
                    label={formatMessage(MESSAGES.targetEntityLabel)}
                    variant="outlined"
                    value={formik.values.entity2_id}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                        formik.touched.entity2_id &&
                        Boolean(formik.errors.entity2_id)
                    }
                    helperText={
                        formik.touched.entity2_id && formik.errors.entity2_id
                    }
                    disabled={isLoading}
                />
                {isError && (
                    <Box mt={2} color="error.main">
                        {/* Try to display the detailed error message from backend if available.
                            Usually 'error.details' contains the validation dict.
                        */}
                        {typeof error?.details === 'object'
                            ? JSON.stringify(error.details)
                            : formatMessage(MESSAGES.error)}
                    </Box>
                )}
            </Box>
        </ConfirmCancelModal>
    );
};

type ButtonProps = {
    onClick: () => void;
};

const ManualDuplicateButton: FunctionComponent<ButtonProps> = ({ onClick }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Button
            variant="outlined"
            color="primary"
            onClick={onClick}
            size="small"
            startIcon={<AddLinkIcon />}
        >
            {formatMessage(MESSAGES.buttonLabel)}
        </Button>
    );
};

const ManualDuplicateDialog = makeFullModal(
    ManualDuplicateModal,
    ManualDuplicateButton,
);

export { ManualDuplicateDialog };
