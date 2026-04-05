import React, { FunctionComponent, useState } from 'react';
import {
    Box,
    FormControlLabel,
    Checkbox,
    Collapse,
    Alert,
    Typography,
} from '@mui/material';
import {
    useSafeIntl,
    makeFullModal,
    FilesUpload,
    SimpleModal,
    LoadingSpinner,
} from 'bluesquare-components';
import { useFormik } from 'formik';
import { FileUploadButtons } from 'Iaso/components/Buttons/FileUploadButtons';
import { useApiErrorValidation } from 'Iaso/libs/validation';
import MESSAGES from '../../messages';
import { BulkImportDefaults } from '../../types';
import { BulkImportButton } from './BulkImportButton';
import { DefaultValuesSection } from './DefaultValuesSection';
import { useBulkUserValidation } from './hooks/useBulkUserValidation';
import { useUploadCsv } from './hooks/useUploadCsv';
import { ValidationErrorTable } from './ValidationErrorTable';

type Props = {
    closeDialog: () => void;
    isOpen: boolean;
    id?: string;
};

type Values = {
    file?: File[];
};

export const BulkImportDialogModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    id,
}) => {
    const { formatMessage } = useSafeIntl();
    const titleMessage = formatMessage(MESSAGES.createUsersFromFile);

    // State for default values toggle and values
    const [showDefaults, setShowDefaults] = useState(false);
    const [defaults, setDefaults] = useState<BulkImportDefaults>({});

    const { mutateAsync: upload, isLoading, error: error } = useUploadCsv();

    const {
        apiErrors,
        payload,
        mutation: save,
    } = useApiErrorValidation<Partial<any>, any>({
        mutationFn: upload,
        onSuccess: () => closeDialog(),
    });

    const validationSchema = useBulkUserValidation(apiErrors, payload);

    const formik = useFormik<Values>({
        initialValues: { file: undefined },
        validationSchema,
        validateOnBlur: true,
        enableReinitialize: true,
        onSubmit: async (values, helpers) => {
            const uploadPayload = showDefaults
                ? { ...values, ...defaults }
                : values;
            save(uploadPayload, helpers);
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

    const allowConfirm = isValid && Boolean(touched.file) && !isLoading;
    const Buttons = ({ closeDialog: close }: { closeDialog: () => void }) => {
        return (
            <FileUploadButtons
                allowConfirm={allowConfirm}
                isLoading={isLoading}
                closeDialog={close}
                onConfirm={() => {
                    handleSubmit();
                }}
                url="/api/bulkcreateuser/getsample/"
            />
        );
    };

    // as formik error parsing flats everything as a string, we need to access this in a "raw" way
    const fileContentErrors = React.useMemo(() => {
        return error?.details?.file_content;
    }, [error?.details]);

    return (
        <SimpleModal
            titleMessage={titleMessage}
            maxWidth={fileContentErrors?.length > 0 ? 'lg' : 'sm'}
            open={isOpen}
            closeDialog={closeDialog}
            id={id ?? 'bulk-user-create'}
            dataTestId="test-bulk-user-create"
            onClose={() => {
                resetForm();
                setShowDefaults(false);
                setDefaults({});
            }}
            buttons={Buttons}
        >
            <Box mt={2}>
                <FilesUpload
                    accept={{
                        'text/csv': ['.csv'],
                    }}
                    files={values.file ?? []}
                    onFilesSelect={files => {
                        setFieldTouched('file', true);
                        setFieldValue('file', files);
                    }}
                    required
                    multi={false}
                    errors={errors?.file ? [errors?.file] : undefined}
                    placeholder={formatMessage(MESSAGES.selectCsvFile)}
                />
            </Box>

            <Box mt={2}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={showDefaults}
                            onChange={e => setShowDefaults(e.target.checked)}
                            data-testid="default-values-toggle"
                        />
                    }
                    label={formatMessage(MESSAGES.setDefaultValues)}
                />
            </Box>

            <Collapse in={showDefaults}>
                <Box mt={1}>
                    <DefaultValuesSection
                        defaults={defaults}
                        onChange={setDefaults}
                    />
                </Box>
            </Collapse>

            {fileContentErrors?.length > 0 && (
                <Box mt={2}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        <Typography variant="subtitle1">
                            {formatMessage(MESSAGES.validationFailed)}
                        </Typography>
                        <Typography variant="body2">
                            {formatMessage(MESSAGES.fixErrorsAndRetry, {
                                count: fileContentErrors.length,
                            })}
                        </Typography>
                    </Alert>
                    <ValidationErrorTable errors={fileContentErrors} />
                </Box>
            )}

            {/* The loading spinner is set so users can still close the modal when the users are loading */}
            {isLoading && <LoadingSpinner absolute={false} fixed={false} />}
            <Box mt={2} sx={{ fontSize: '12px' }}>
                {formatMessage(MESSAGES.bulkImportDialogDescription)}
            </Box>
        </SimpleModal>
    );
};

const withButton = makeFullModal(BulkImportDialogModal, BulkImportButton);

export { withButton as BulkImportUsersDialog };
