import React, { FunctionComponent, useMemo, useState } from 'react';
import { Box, FormControlLabel, Checkbox, Collapse } from '@mui/material';
import {
    useSafeIntl,
    makeFullModal,
    FilesUpload,
    SimpleModal,
    LoadingSpinner,
} from 'bluesquare-components';
import { useFormik } from 'formik';
import { FileUploadButtons } from '../../../../components/Buttons/FileUploadButtons';
import { useApiErrorValidation } from '../../../../libs/validation';
import MESSAGES from '../../messages';
import { BulkImportDefaults } from '../../types';
import { BulkImportButton } from './BulkImportButton';
import { DefaultValuesSection } from './DefaultValuesSection';
import { useBulkUserValidation } from './hooks/useBulkUserValidation';
import { useUploadCsv } from './hooks/useUploadCsv';

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

    const { mutateAsync: upload, isLoading } = useUploadCsv();

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

    // custom logic to show both api and formik errors.
    // No translation is possible for the backend as it needs to be refactored to send translation keys
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
                url="/api/bulkcreateuser/getsample/"
            />
        );
    };

    return (
        <SimpleModal
            titleMessage={titleMessage}
            maxWidth="sm"
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
                    files={values.file ?? []}
                    onFilesSelect={files => {
                        setFieldTouched('file', true);
                        setFieldValue('file', files);
                    }}
                    required
                    multi={false}
                    errors={formikAndApiErrors}
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

            {/* The loading spinner is set so users can still close the modal when the users are loading */}
            {isLoading && <LoadingSpinner absolute={false} fixed={false} />}
        </SimpleModal>
    );
};

const withButton = makeFullModal(BulkImportDialogModal, BulkImportButton);

export { withButton as BulkImportUsersDialog };
