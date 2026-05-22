import React, { useState } from 'react';
import {
    Box,
    FormControlLabel,
    Checkbox,
    Collapse,
    Alert,
    Typography,
    Container,
    Button,
} from '@mui/material';
import {
    useSafeIntl,
    FilesUpload,
    LoadingSpinner,
    useRedirectTo,
} from 'bluesquare-components';
import { useFormik } from 'formik';
import { baseUrls } from 'Iaso/constants/urls';
import { DropdownSampleDownload } from 'Iaso/domains/users/components/BulkImport/DropdownSampleDownload';
import { useApiErrorValidation } from 'Iaso/libs/validation';
import MESSAGES from '../../messages';
import { BulkImportButton } from './BulkImportButton';
import { DefaultValuesSection } from './DefaultValuesSection';
import { useBulkUserValidation } from './hooks/useBulkUserValidation';
import { useUploadCsv } from './hooks/useUploadCsv';
import { ValidationErrorTable } from './ValidationErrorTable';

type BulkImportFormProps = {
    cancelUrl?: string;
};

type Values = {
    file?: File[];
};

export const BulkImportForm = ({ cancelUrl }: BulkImportFormProps) => {
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();
    // State for default values toggle and values
    const [showDefaults, setShowDefaults] = useState(false);

    const { mutateAsync: upload, isLoading, error: error } = useUploadCsv();

    const {
        apiErrors,
        payload,
        mutation: save,
    } = useApiErrorValidation<Partial<any>, any>({
        mutationFn: upload,
        onSuccess: () => redirectTo(baseUrls.users),
    });

    const validationSchema = useBulkUserValidation(apiErrors, payload);

    const formik = useFormik<Values>({
        initialValues: { file: undefined },
        validationSchema,
        validateOnBlur: true,
        enableReinitialize: true,
        onSubmit: async (values, helpers) => {
            save(values, helpers);
        },
    });

    const {
        errors,
        values,
        setFieldValue,
        setFieldTouched,
        handleSubmit,
        isValid,
        dirty,
        isSubmitting,
    } = formik;

    // as formik error parsing flats everything as a string, we need to access this in a "raw" way
    const fileContentErrors = React.useMemo(() => {
        return error?.details?.file_content;
    }, [error?.details]);

    return (
        <Container maxWidth="md" sx={{ mt: 6 }}>
            {isLoading && <LoadingSpinner />}
            <Box mt={2}>
                <FilesUpload
                    accept={{
                        'text/csv': ['.csv'],
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                            ['.xls', '.xlsx'],
                    }}
                    files={values.file ?? []}
                    onFilesSelect={files => {
                        setFieldTouched('file', true);
                        setFieldValue('file', files);
                    }}
                    required
                    multi={false}
                    errors={errors?.file ? [errors?.file] : undefined}
                    placeholder={formatMessage(MESSAGES.selectFile)}
                />
            </Box>
            <Box mt={2} sx={{ fontSize: '12px' }}>
                {formatMessage(MESSAGES.bulkImportDialogDescription)}
            </Box>
            <Box mt={2}>
                <DropdownSampleDownload
                    options={[
                        {
                            text: 'CSV',
                            href: '/api/bulkcreateuser/get-sample-csv/',
                            component: 'a',
                            download: 'true',
                        },
                        {
                            text: 'XLSX',
                            href: '/api/bulkcreateuser/get-sample-xlsx/',
                            component: 'a',
                            download: 'true',
                        },
                    ]}
                    buttonText={formatMessage(MESSAGES.downloadTemplate)}
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

            <Collapse in={showDefaults} unmountOnExit={false}>
                <Box mt={1}>
                    <DefaultValuesSection
                        defaults={values}
                        errors={errors}
                        setFieldValue={setFieldValue}
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
            <Box
                mt={2}
                sx={{
                    display: 'flex',
                    justifyContent: cancelUrl ? 'space-between' : 'flex-end',
                }}
            >
                {cancelUrl && (
                    <Button
                        variant={'contained'}
                        color="error"
                        href={cancelUrl}
                    >
                        {formatMessage(MESSAGES.cancel)}
                    </Button>
                )}
                <BulkImportButton
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting || !isValid || !dirty || isLoading}
                />
            </Box>
        </Container>
    );
};
