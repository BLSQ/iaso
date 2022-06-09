import { useCallback, useState } from 'react';

type Params = {
    mutationFn: any;
    onSuccess?: any;
    onError?: any;
    onCatch?: any;
    convertError?: (
        // eslint-disable-next-line no-unused-vars
        errorsDict: Record<string, string>,
    ) => Record<string, string>;
};

type ApiValidationUtils<T> = {
    payload: T;
    apiErrors: Record<string, string>;
    mutation: Function;
};
// Assumes mutaytion from react-query
// Assumes helpers from formik
// Assumes a stable Api error format
// TODO handle non_field_errors
export const useApiErrorValidation = <T,>({
    mutationFn,
    onSuccess,
    onError,
    onCatch,
    convertError,
}: Params): ApiValidationUtils<T> => {
    const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
    const [payload, setPayload] = useState<T>({});
    const mutation = useCallback(
        (values: T, helpers: any) => {
            setPayload(values);
            return mutationFn(values, {
                onSuccess,
                onError: (e: any) => {
                    const errorKeys = Object.keys(e.details);
                    const errorsDict = {};
                    errorKeys.forEach(errorKey => {
                        errorsDict[errorKey] = e.details[errorKey].join(', ');
                    });
                    const apiErrorsDict = convertError
                        ? convertError(errorsDict)
                        : errorsDict;
                    if (helpers) {
                        helpers?.setErrors(apiErrorsDict);
                    }
                    setApiErrors(apiErrorsDict);
                    if (onError) onError();
                },
            }).catch(e => {
                if (e.status >= 500) throw e;
                if (onCatch) onCatch();
            });
        },
        [convertError, mutationFn, onCatch, onError, onSuccess],
    );

    return {
        payload,
        apiErrors,
        mutation,
    };
};
