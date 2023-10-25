import React, { FunctionComponent, useCallback, useMemo } from 'react';
import {
    useSafeIntl,
    makeFullModal,
    FilesUpload,
    SimpleModal,
    LoadingSpinner,
} from 'bluesquare-components';
import { Box } from '@mui/material';
import { useFormik } from 'formik';

import { useQueryClient } from 'react-query';
import { useDispatch } from 'react-redux';
import MESSAGES from '../../../constants/messages';
import { useUploadLine } from './useUploadLine';
import { useApiErrorValidation } from '../../../../../../../hat/assets/js/apps/Iaso/libs/validation';
import { enqueueSnackbar } from '../../../../../../../hat/assets/js/apps/Iaso/redux/snackBarsReducer';
import { useImportLineValidation } from './useImportLineValidation';
import { ImportLineButton } from './ImportLineButton';
import { FileUploadButtons } from '../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/FileUploadButtons';

type Props = {
    closeDialog: () => void;
    isOpen: boolean;
    id?: string;
};

type Values = {
    file?: File[];
};

const ImportLine: FunctionComponent<Props> = ({ isOpen, closeDialog, id }) => {
    const { formatMessage } = useSafeIntl();
    const titleMessage = formatMessage(MESSAGES.importLineList);

    const { mutateAsync: upload, isLoading } = useUploadLine();
    const queryClient = useQueryClient();
    const dispatch = useDispatch();

    const onSuccess = useCallback(
        data => {
            queryClient.invalidateQueries(['polio', 'campaigns']);
            dispatch(
                enqueueSnackbar({
                    messageObject: formatMessage(
                        MESSAGES.campaignImportSuccess,
                        {
                            amount: data.import_result.created,
                        },
                    ),
                    options: {
                        variant: 'success',
                        persist: false,
                    },
                }),
            );
            closeDialog();
        },
        [closeDialog, dispatch, formatMessage, queryClient],
    );

    const {
        apiErrors,
        payload,
        mutation: save,
    } = useApiErrorValidation<Partial<any>, any>({
        mutationFn: upload,
        onSuccess,
    });

    const validationSchema = useImportLineValidation(apiErrors, payload);

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
                url="/api/polio/linelistimport/getsample/"
            />
        );
    };

    return (
        <>
            <SimpleModal
                titleMessage={titleMessage}
                maxWidth="sm"
                open={isOpen}
                closeDialog={closeDialog}
                id={id ?? 'linelist-import'}
                dataTestId="test-linelist-import"
                onClose={() => resetForm()}
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
                        placeholder={formatMessage(
                            MESSAGES.importExcelLinefile,
                        )}
                    />
                </Box>
                {/* The loading spinner is set so users can still close the modal when the users are loading */}
                {isLoading && <LoadingSpinner absolute={false} fixed={false} />}
            </SimpleModal>
        </>
    );
};

const withButton = makeFullModal(ImportLine, ImportLineButton);

export { withButton as ImportLine };
