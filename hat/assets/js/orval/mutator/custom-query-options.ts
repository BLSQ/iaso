import { IntlMessage } from 'bluesquare-components';
import { openSnackBar } from 'Iaso/components/snackBars/EventDispatcher';
import { errorSnackBar } from 'Iaso/constants/snackBars';
import { ApiError } from 'Iaso/libs/Api';
import { MESSAGES } from 'Iaso/libs/apiHooks';
import { OperationConfig } from '../apiConfiguration';

const isApiError = (error: unknown): error is ApiError => {
    return typeof error === 'object' && error !== null && 'status' in error;
};

type QueryMeta = {
    dispatchOnError?: boolean;
    ignoreErrorCodes?: number[];
    snackErrorMsg?: IntlMessage;
};

export const getCustomQueryOptions = <TOptions, TError>(
    options: TOptions,
): TOptions => {
    // workaround for orval not injecting overrides when using a custom query
    const defaults =
        // @ts-ignore
        (OperationConfig?.operations?.[options?.queryKey?.[0]]?.query
            ?.options as TOptions) ?? {};

    const meta = ((options as any)?.meta ?? {}) as QueryMeta;

    const {
        dispatchOnError = true,
        ignoreErrorCodes,
        snackErrorMsg = MESSAGES.defaultQueryApiSuccess,
    } = meta;

    const optionsOnError = (options as any).onError;

    return {
        onError: (error: TError) => {
            if (
                dispatchOnError &&
                isApiError(error) &&
                !ignoreErrorCodes?.includes(error.status)
            ) {
                openSnackBar(errorSnackBar(undefined, snackErrorMsg, error));
            }

            optionsOnError?.(error);
        },
        ...defaults,
        ...(options as object),
    } as TOptions;
};
