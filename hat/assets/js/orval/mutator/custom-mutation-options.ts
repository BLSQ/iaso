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

type MutationMeta = {
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

export const useCustomMutationOptions = <
    TData = unknown,
    TError = unknown,
    TVariables = void,
    TContext = unknown,
>(
    mutationOptions: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationOptions<TData, TError, TVariables, TContext> => {
    const { formatMessage } = useSafeIntl();

    const meta = (mutationOptions.meta ?? {}) as MutationMeta;

    const {
        snackSuccessMessage = MESSAGES.defaultMutationApiSuccess,
        snackErrorMsg = MESSAGES.defaultMutationApiError,
        showSuccessSnackBar = true,
        ignoreErrorCodes = [],
        useApiErrorMessage = false,
        successSnackBar = msg => succesfullSnackBar(undefined, msg),
    } = meta;

    const {
        onSuccess: optionsOnSuccess,
        onError: optionsOnError,
        ...newMutationOptions
    } = mutationOptions;

    return {
        onError: (error, variables, context) => {
            if (isApiError(error) && !ignoreErrorCodes.includes(error.status)) {
                let errorMsg = formatMessage(snackErrorMsg);

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

            return optionsOnError?.(error, variables, context);
        },

        onSuccess: (data, variables, context) => {
            if (snackSuccessMessage && showSuccessSnackBar) {
                openSnackBar(successSnackBar(snackSuccessMessage));
            }

            return optionsOnSuccess?.(data, variables, context);
        },

        ...newMutationOptions,
    };
};
