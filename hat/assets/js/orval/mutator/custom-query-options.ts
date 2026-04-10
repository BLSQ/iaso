import { IntlMessage } from 'bluesquare-components';
import { openSnackBar } from 'Iaso/components/snackBars/EventDispatcher';
import { errorSnackBar } from 'Iaso/constants/snackBars';
import { ApiError } from 'Iaso/libs/Api';
import { MESSAGES } from 'Iaso/libs/apiHooks';

const isApiError = (error: unknown): error is ApiError => {
    return typeof error === 'object' && error !== null && 'status' in error;
};

type UseQueryOptions<TOptions, TError> = TOptions & {
    dispatchOnError?: boolean;
    ignoreErrorCodes?: number[];
    snackErrorMsg?: IntlMessage;
    onError?: (error: TError) => void;
};

export const useCustomQueryOptions = <TOptions, TError>(
    options: UseQueryOptions<TOptions, TError>,
): Omit<
    UseQueryOptions<TOptions, TError>,
    'dispatchOnError' | 'ignoreErrorCodes' | 'snackErrorMsg'
> => {
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
        ...(newOptions as TOptions),
    } as const;
};
