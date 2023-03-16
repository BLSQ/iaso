import { FormikErrors, FormikHelpers, FormikTouched } from 'formik';
import { useCallback, useMemo, useState } from 'react';
import { UseMutateAsyncFunction } from 'react-query';
import { TestConfig, TestContext } from 'yup';
import { isEqual } from 'lodash';
import { ApiError } from './Api';
import { IntlFormatMessage, IntlMessage } from '../types/intl';
import { ValidationError } from '../types/utils';

/**
 * The params passed to the hook
 * mutationFn is mutateAsync from react-query's useMutation
 *
 * convertError is for cases when the field keys of the api response don't match the field keys of your formik values
 */

type Params = {
    // Typing for this function is taken from react-query's docs.
    mutationFn: UseMutateAsyncFunction<any, any, any>;
    onSuccess?: any;
    onError?: any;
    onCatch?: any;
    convertError?: (
        // eslint-disable-next-line no-unused-vars
        errorsDict: Record<string, string>,
    ) => Record<string, string>;
};

/**
 * HOW TO USE:
 *
 * Pass a mutateAsync function from useMutation or useSnackMutation to useApiErrorValidation.
 * The hook will save the payload sent to the API and the errors received in its state and return them along with a function
 * that can then be passed as useFormik's onSubmit parameter.
 * Apart from saving the payload and errors to the hook's state, that function will also throw if the error is not in the 400 range
 *
 * onSuccess and onError have the same use as with useMutation/useSnackMutation
 *
 * onCatch allows you to add custom error management
 *
 * payload and errors can then be passed to makeAPIErrorValidator to generate a `test()` that can be used
 * in a validation hook based on yup, in order to manage backend errors to your form management
 *
 */

/**
 * T is the type of the payload sent to the API
 * K is the type of the response
 * void in return type Promise<void|K> is for when error is caught
 *
 *The hook assumes that all fields have their own error and does not handle non_field_errors
 *
 */

type ApiValidationUtils<
    T extends Record<string, any>,
    K extends Record<string, any>,
> = {
    payload: T;
    apiErrors: Record<string, string>;
    // eslint-disable-next-line no-unused-vars
    mutation: (values: T, helpers: any) => Promise<void | K>;
};

// TODO handle non_field_errors
export const useApiErrorValidation = <
    T extends Record<string, any>,
    K extends Record<string, any>,
>({
    mutationFn,
    onSuccess,
    onError,
    onCatch,
    convertError,
}: Params): ApiValidationUtils<T, K> => {
    const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
    const [payload, setPayload] = useState<T>({} as T);
    const mutation = useCallback(
        (values: T, helpers: FormikHelpers<T>): Promise<void | K> => {
            setPayload(values);
            return mutationFn(values, {
                onSuccess,
                onError: (e: ApiError) => {
                    const errorKeys = Object.keys(e.details);
                    const errorsDict = {};
                    errorKeys.forEach(errorKey => {
                        if (Array.isArray(e.details[errorKey])) {
                            errorsDict[errorKey] =
                                e.details[errorKey].join(', ');
                        } else {
                            errorsDict[errorKey] = e.details[errorKey];
                        }
                    });
                    const apiErrorsDict = convertError
                        ? convertError(errorsDict)
                        : errorsDict;
                    if (helpers) {
                        helpers?.setErrors(apiErrorsDict as FormikErrors<T>);
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
/**
 * HOW TO USE:
 *
 * payload and errors should come from useApiErrorValidation (to access backend errors, see above)
 * formatMessage and messages are just the usual translation tools.
 *
 * The function will return a test that can be used as part of a yup schema.
 *
 * It compares the value of the form field with the value sent to the backend for that field. If the values match
 * and there was a backend error for this field, the validation will fail.
 *
 *
 * The errors sent by the backend (and access with errors[fieldKey]) should be keys from the MESSAGES object used to get translations
 *
 * The translations themeselves should be done at the parent level, using useTranslatedErrors
 *
 */

type TestContextExtended = TestContext<Record<string, any>> & {
    originalValue: any;
};

export const useAPIErrorValidator = <T,>(
    errors: ValidationError,
    payload: T,
    // eslint-disable-next-line no-unused-vars
): ((fieldKey: string) => TestConfig<any, Record<string, any>>) => {
    return useMemo(
        () =>
            (fieldKey: string): TestConfig<any, Record<string, any>> => {
                return {
                    name: `API Errors ${fieldKey}`,
                    test: (_value, context: TestContextExtended) => {
                        if (
                            errors?.[fieldKey] &&
                            // Using originalValue to avoid mismatches due to yup's `transform` method, eg with dates
                            isEqual(context.originalValue, payload?.[fieldKey])
                        ) {
                            return false;
                        }
                        return true;
                    },
                    message: errors?.[fieldKey] ?? null,
                } as TestConfig<any, Record<string, any>>;
            },
        [errors, payload],
    );
};

type GetErrorParams = {
    formatMessage: IntlFormatMessage;
    touched: Record<string, boolean> | FormikTouched<any>;
    errors: Record<string, string> | FormikErrors<any>;
    messages: Record<string, IntlMessage>;
};

/**
 * Takes touched and errors from formik
 * messages is the usual MESSAGES dict of translations
 * formatMessage should come from useSafeIntl
 *
 * returns a callback that can be called in the `errors`props of an InputComponent to provide a translated error message
 *
 * touched is used to prevent setting the fields in error before the user has had a chance to type
 *
 */
export const useTranslatedErrors = ({
    formatMessage,
    touched,
    errors,
    messages,
}: // eslint-disable-next-line no-unused-vars
GetErrorParams): ((keyValue: string) => string[]) => {
    const getErrors = useCallback(
        keyValue => {
            if (!touched[keyValue]) return [];
            const errorKey = errors[keyValue];
            if (!errorKey) return [];
            const message = messages[errorKey as string]
                ? formatMessage(messages[errorKey as string])
                : (errorKey as string);
            return [message];
        },
        [errors, formatMessage, messages, touched],
    );
    return getErrors;
};
