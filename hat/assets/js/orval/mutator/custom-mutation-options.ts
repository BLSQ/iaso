import {
    errorSnackBar,
    IntlMessage,
    succesfullSnackBar,
    useSafeIntl,
} from 'bluesquare-components';
import { UseMutationOptions } from 'react-query';
import { openSnackBar } from 'Iaso/components/snackBars/EventDispatcher';
import { ApiError } from 'Iaso/libs/Api';
import { getApiErrorMessage, MESSAGES } from 'Iaso/libs/apiHooks';

const isApiError = (error: unknown): error is ApiError => {
    return typeof error === 'object' && error !== null && 'status' in error;
};

type ExtraMutationOptions = {
    snackSuccessMessage?: IntlMessage;
    snackErrorMsg?: IntlMessage;
    showSuccessSnackBar?: boolean;
    ignoreErrorCodes?: number[];
    useApiErrorMessage?: boolean;
    successSnackBar?: (msg: IntlMessage) => {
        messageKey: string;
        messageObject: any;
        options: {
            variant: string;
            persist: boolean;
        };
    };
};

type UseMutationOptionsWithExtra<TData, TError, TVariables, TContext> =
    UseMutationOptions<TData, TError, TVariables, TContext> &
        ExtraMutationOptions;

export const useCustomMutationOptions = <
    TData = unknown, // All unknown because this is function is used across all mutations.
    TError = unknown,
    TVariables = void,
    TContext = unknown,
>(
    mutationOptions: UseMutationOptionsWithExtra<
        TData,
        TError,
        TVariables,
        TContext
    >,
): UseMutationOptions<TData, TError, TVariables, TContext> => {
    const { formatMessage } = useSafeIntl();
    const {
        snackSuccessMessage = MESSAGES.defaultMutationApiSuccess,
        snackErrorMsg = MESSAGES.defaultMutationApiError,
        showSuccessSnackBar = true,
        ignoreErrorCodes = [],
        useApiErrorMessage = false,
        onSuccess: optionsOnSuccess,
        onError: optionsOnError,
        successSnackBar = msg => succesfullSnackBar(undefined, msg),
        ...newMutationOptions
    } = mutationOptions;

    return {
        onError: (error, variables, context) => {
            if (isApiError(error) && !ignoreErrorCodes.includes(error.status)) {
                let errorMsg = snackErrorMsg;

                if (error.status === 403) {
                    if (error.details.detail) {
                        errorMsg = error.details.detail;
                    } else if (!errorMsg) {
                        errorMsg = formatMessage(MESSAGES.permissionError);
                    }
                } else if (useApiErrorMessage && error.details) {
                    errorMsg = getApiErrorMessage(error) as any;
                }

                openSnackBar(errorSnackBar(undefined, errorMsg, error));
            }
            if (optionsOnError) {
                return optionsOnError(error, variables, context);
            }
            return undefined;
        },
        onSuccess: (data, variables, context) => {
            if (snackSuccessMessage && showSuccessSnackBar) {
                openSnackBar(successSnackBar(snackSuccessMessage));
            }
            if (optionsOnSuccess) {
                return optionsOnSuccess(data, variables, context);
            }
            return undefined;
        },
        ...newMutationOptions,
    };
};
