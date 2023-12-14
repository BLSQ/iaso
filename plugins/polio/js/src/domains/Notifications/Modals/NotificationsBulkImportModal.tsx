import React, { FunctionComponent, useMemo } from 'react';
import { Accept } from 'react-dropzone';
import { Box } from '@material-ui/core';
import { useFormik } from 'formik';
import {
    FilesUpload,
    LoadingSpinner,
    makeFullModal,
    SimpleModal,
    useSafeIntl,
} from 'bluesquare-components';

import { BulkImportButton } from '../../../../../../../hat/assets/js/apps/Iaso/domains/users/components/BulkImportDialog/BulkImportButton';
import { useApiErrorValidation } from '../../../../../../../hat/assets/js/apps/Iaso/libs/validation';
import { FileUploadButtons } from '../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/FileUploadButtons';

import MESSAGES from '../messages';
import { XlsxFile } from '../types';
import { useBulkImportNotificationSchema } from '../hooks/validation';
import { useUploadXlsx } from '../hooks/api';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    id?: string;
};

const BulkImportNotificationModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    id,
}) => {
    const { formatMessage } = useSafeIntl();

    const { mutateAsync: upload, isLoading } = useUploadXlsx();

    const {
        apiErrors,
        payload,
        mutation: save,
    } = useApiErrorValidation<Partial<any>, any>({
        mutationFn: upload,
        onSuccess: () => closeDialog(),
    });

    const validationSchema = useBulkImportNotificationSchema(
        apiErrors,
        payload,
    );

    const formik = useFormik<XlsxFile>({
        initialValues: { file: undefined },
        validationSchema,
        validateOnBlur: true,
        enableReinitialize: true,
        onSubmit: async (values, helpers) => {
            save(values, helpers);
        },
    });

    const {
        touched,
        errors,
        values,
        setFieldValue,
        setFieldTouched,
        resetForm,
        handleSubmit,
        isValid,
    } = formik;

    // Custom logic to show both api and formik errors.
    const formikAndApiErrors = useMemo(() => {
        const result: string[] = [];
        const formikError = errors.file;
        const apiError = apiErrors.error;
        if (formikError) {
            result.push(formikError);
        }
        if (apiError) {
            result.push(apiError);
        }
        return result;
    }, [apiErrors.error, errors.file]);

    const allowConfirm = isValid && Boolean(touched.file) && !isLoading;
    const Buttons = ({ closeDialog: close }) => {
        return (
            <FileUploadButtons
                allowConfirm={allowConfirm}
                isLoading={isLoading}
                closeDialog={close}
                onConfirm={() => {
                    handleSubmit();
                }}
                url="/api/polio/notifications/download_sample_xlsx/"
            />
        );
    };

    const accept: Accept = {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
            '.xslx',
        ],
    };

    return (
        <SimpleModal
            titleMessage={MESSAGES.modalBulkImportTitle}
            maxWidth="sm"
            open={isOpen}
            closeDialog={closeDialog}
            id={id ?? 'bulk-create-notification'}
            dataTestId="bulk-create-notification"
            onClose={() => resetForm()}
            buttons={Buttons}
        >
            <p>{formatMessage(MESSAGES.modalBulkImportXlsxFileFormat)}</p>
            <Box mt={2}>
                <FilesUpload
                    accept={accept}
                    files={values.file ?? []}
                    onFilesSelect={files => {
                        setFieldTouched('file', true);
                        setFieldValue('file', files);
                    }}
                    required
                    multi={false}
                    errors={formikAndApiErrors}
                    placeholder={formatMessage(
                        MESSAGES.modalBulkImportSelectXlsxFile,
                    )}
                />
            </Box>
            <p>
                {formatMessage(MESSAGES.modalBulkImportXlsxBackgroundWarning)}
            </p>
            {isLoading && <LoadingSpinner absolute={false} fixed={false} />}
        </SimpleModal>
    );
};

const modalWithButton = makeFullModal(
    BulkImportNotificationModal,
    BulkImportButton,
);

export { modalWithButton as BulkImportNotificationModal };
