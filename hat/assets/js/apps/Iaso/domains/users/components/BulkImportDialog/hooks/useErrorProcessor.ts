import { useMemo } from 'react';
import { ValidationError } from '../../../../../types/utils';

interface ErrorProcessorResult {
    csvValidationErrors: any[];
    simpleErrors: string[];
}

export const useErrorProcessor = (
    apiErrors: ValidationError,
    formikFileError?: string,
): ErrorProcessorResult => {
    return useMemo(() => {
        const csvErrors = apiErrors?.error?.file?.csv_validation_errors || [];
        const simple: string[] = [];

        if (formikFileError) {
            simple.push(formikFileError);
        }

        const apiError = apiErrors.error;
        if (apiError && !csvErrors.length) {
            simple.push(apiError);
        }

        return {
            csvValidationErrors: csvErrors,
            simpleErrors: simple,
        };
    }, [apiErrors.error, formikFileError]);
};
