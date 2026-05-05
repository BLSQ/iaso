import { IntlMessage } from 'bluesquare-components';
import { openSnackBar } from 'Iaso/components/snackBars/EventDispatcher';
import { errorSnackBar } from 'Iaso/constants/snackBars';
import { ApiError } from 'Iaso/libs/Api';
import { MESSAGES } from 'Iaso/libs/apiHooks';
import { OperationConfig } from '../apiConfiguration';

const isApiError = (error: unknown): error is ApiError => {
    return typeof error === 'object' && error !== null && 'status' in error;
};

type UseQueryOptions<TOptions, TError> = TOptions & {
    dispatchOnError?: boolean;
    ignoreErrorCodes?: number[];
    snackErrorMsg?: IntlMessage;
    onError?: (error: TError) => void;
};

export const getCustomQueryOptions = <TOptions, TError>(
    options: UseQueryOptions<TOptions, TError>,
): Omit<
    UseQueryOptions<TOptions, TError>,
    'dispatchOnError' | 'ignoreErrorCodes' | 'snackErrorMsg'
> => {
    // workaround for orval not injecting overrides when using a custom query
    // see orval.config overrides commented out line
    const defaults =
        // @ts-ignore
        (OperationConfig?.operations?.[options?.queryKey?.[0]]?.query
            ?.options as UseQueryOptions<TOptions, TError>) ?? {};

    const {
        dispatchOnError = true,
        ignoreErrorCodes,
        snackErrorMsg = MESSAGES.defaultQueryApiSuccess,
        onError: optionsOnError,
        ...newOptions
    } = options;
    return {
        onError: (error: TError) => {
            if (
                dispatchOnError &&
                isApiError(error) &&
                !ignoreErrorCodes?.includes(error.status)
            ) {
                openSnackBar(errorSnackBar(undefined, snackErrorMsg, error));
            }
            if (optionsOnError) {
                optionsOnError(error);
            }
        },
        ...defaults,
        ...(newOptions as TOptions),
    } as const;
};
