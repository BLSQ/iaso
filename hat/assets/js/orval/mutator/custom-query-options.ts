import { IntlMessage } from 'bluesquare-components';
import moment from 'moment';
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
    localeAware?: boolean;
};

export const getCustomQueryOptions = <TOptions, TError>(
    options: TOptions,
): TOptions => {
    // workaround for orval not injecting overrides when using a custom query
    const defaults =
        // @ts-ignore
        (OperationConfig?.operations?.[options?.queryKey?.[0]]?.query
            ?.options as TOptions) ?? {};

    const defaultLocaleAware =
        // @ts-ignore
        (OperationConfig?.operations?.[options?.queryKey?.[0]]?.query
            ?.meta as QueryMeta) ?? {};

    const meta = ((options as any)?.meta ?? {}) as QueryMeta;

    const {
        dispatchOnError = true,
        ignoreErrorCodes,
        snackErrorMsg = MESSAGES.defaultQueryApiSuccess,
        localeAware = defaultLocaleAware?.localeAware,
    } = meta;

    const optionsOnError = (options as any).onError;

    if (localeAware && (options as any)?.queryKey) {
        (options as any).queryKey = [
            ...(options as any).queryKey,
            moment().locale(),
        ];
    }

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
