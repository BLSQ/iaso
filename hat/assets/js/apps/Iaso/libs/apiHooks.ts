import { useRef } from 'react';
import { useDispatch } from 'react-redux';
import {
    MutationFunction,
    QueryKey,
    useMutation,
    UseMutationOptions,
    UseMutationResult,
    useQueries,
    useQuery,
    useQueryClient,
    UseQueryOptions,
    UseQueryResult,
    QueryFunction,
} from 'react-query';
import { defineMessages } from 'react-intl';
import { enqueueSnackbar } from '../redux/snackBarsReducer';
import { errorSnackBar, succesfullSnackBar } from '../constants/snackBars';
import { IntlMessage } from '../types/intl';

const MESSAGES = defineMessages({
    defaultMutationApiError: {
        id: 'iaso.snackBar.error',
        defaultMessage: 'An error occurred while saving',
    },
    defaultMutationApiSuccess: {
        id: 'iaso.snackBar.successful',
        defaultMessage: 'Saved successfully',
    },
    defaultQueryApiSuccess: {
        defaultMessage: 'An error occurred while fetching data',
        id: 'iaso.snackBar.fetch.error',
    },
});

/**
 * Mix a useMutation from react-query and snackbar message as well as
 * cache invalidation.
 *
 * Per default will display a message on success and on error.
 * Success message can be disabled
 *
 * @param mutationFn
 * @param snackSuccessMessage
 *   Snack Message to display in case of success, optional
 *   pass null to suppress, undefined for default.
 * @param snackErrorMsg
 *  Snack Message to display in case of success, optional
 *  pass null to suppress, undefined for default.
 * @param invalidateQueryKey
 *   optional query key to invalidate
 * @param options
 *   standard useMutation Options
 * @returns {UseMutationResult<mutationFn, options, void, unknown>}
 */
type SnackMutationDict<Data, Error, Variables, Context> = {
    mutationFn: MutationFunction<Data, any>;
    snackSuccessMessage?: IntlMessage;
    snackErrorMsg?: IntlMessage;
    invalidateQueryKey?: QueryKey | undefined;
    options?:
        | Omit<
              UseMutationOptions<Data, Error, Variables, Context>,
              'mutationFn'
          >
        | undefined;
    ignoreErrorCodes?: number[];
    showSucessSnackBar?: boolean;
    successSnackBar?: (
        // eslint-disable-next-line no-unused-vars
        msg: IntlMessage,
        // eslint-disable-next-line no-unused-vars
        data: any,
    ) => {
        messageKey: string;
        messageObject: any;
        options: {
            variant: string;
            persist: boolean;
        };
    };
};

const useBaseSnackMutation = <
    Data = unknown,
    Error = unknown,
    Variables = void,
    Context = unknown,
>(
    mutationFn: MutationFunction<Data, any>,
    snackSuccessMessage: IntlMessage = MESSAGES.defaultMutationApiSuccess,
    snackErrorMsg: IntlMessage = MESSAGES.defaultMutationApiError,
    invalidateQueryKey: QueryKey | undefined = undefined,
    options:
        | Omit<
              UseMutationOptions<Data, Error, Variables, Context>,
              'mutationFn'
          >
        | undefined = {},
    showSucessSnackBar = true,
    ignoreErrorCodes: number[] = [],
    successSnackBar: (
        // eslint-disable-next-line no-unused-vars
        msg: IntlMessage,
        // eslint-disable-next-line no-unused-vars
        data: any,
    ) => {
        messageKey: string;
        messageObject: any;
        options: {
            variant: string;
            persist: boolean;
        };
    } = msg => succesfullSnackBar(undefined, msg),
): UseMutationResult<Data, Error, Variables, Context> => {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const newOptions: Omit<
        UseMutationOptions<any, any, any, any>,
        'mutationFn'
    > = {
        ...options,
        onError: (error, variables, context) => {
            if (!ignoreErrorCodes.includes(error.status)) {
                dispatch(
                    enqueueSnackbar(
                        errorSnackBar(undefined, snackErrorMsg, error),
                    ),
                );
            }
            if (options.onError) {
                return options.onError(error, variables, context);
            }
            return undefined;
        },
        onSuccess: (data, variables, context) => {
            if (snackSuccessMessage && showSucessSnackBar) {
                dispatch(
                    enqueueSnackbar(successSnackBar(snackSuccessMessage, data)),
                );
            }
            if (invalidateQueryKey) {
                queryClient.invalidateQueries(invalidateQueryKey);
            }
            if (options.onSuccess) {
                return options.onSuccess(data, variables, context);
            }
            return undefined;
        },
    };
    return useMutation(mutationFn, newOptions);
};

// This hook can take a dictionay or a list of arguments. If the first argument is a dictionary, all other arguments will be ignored
export const useSnackMutation = <
    Data = unknown,
    Error = unknown,
    Variables = void,
    Context = unknown,
>(
    mutationArg:
        | MutationFunction<Data, any>
        | SnackMutationDict<Data, Error, Variables, Context>,
    snackSuccessMessage: IntlMessage = MESSAGES.defaultMutationApiSuccess,
    snackErrorMsg: IntlMessage = MESSAGES.defaultMutationApiError,
    invalidateQueryKey: QueryKey | undefined = undefined,
    options:
        | Omit<
              UseMutationOptions<Data, Error, Variables, Context>,
              'mutationFn'
          >
        | undefined = {},
    showSucessSnackBar = true,
    ignoreErrorCodes: number[] = [],
    successSnackBar: (
        // eslint-disable-next-line no-unused-vars
        msg: IntlMessage,
        // eslint-disable-next-line no-unused-vars
        data: any,
    ) => {
        messageKey: string;
        messageObject: any;
        options: {
            variant: string;
            persist: boolean;
        };
    } = msg => succesfullSnackBar(undefined, msg),
): UseMutationResult<Data, Error, Variables, Context> => {
    let arg1;
    let arg2;
    let arg3;
    let arg4;
    let arg5;
    let arg6;
    let arg7;
    let arg8;
    // Checking if the first argument passed is a dictionary
    const keys = Object.keys(mutationArg) ?? [];
    if (keys.length > 0 && keys.includes('mutationFn')) {
        arg1 = (
            mutationArg as SnackMutationDict<Data, Error, Variables, Context>
        ).mutationFn;
        arg2 = (
            mutationArg as SnackMutationDict<Data, Error, Variables, Context>
        ).snackSuccessMessage;
        arg3 = (
            mutationArg as SnackMutationDict<Data, Error, Variables, Context>
        ).snackErrorMsg;
        arg4 = (
            mutationArg as SnackMutationDict<Data, Error, Variables, Context>
        ).invalidateQueryKey;
        arg5 = (
            mutationArg as SnackMutationDict<Data, Error, Variables, Context>
        ).options;
        arg6 = (
            mutationArg as SnackMutationDict<Data, Error, Variables, Context>
        ).showSucessSnackBar;
        arg7 = (
            mutationArg as SnackMutationDict<Data, Error, Variables, Context>
        ).ignoreErrorCodes;
        arg8 = (
            mutationArg as SnackMutationDict<Data, Error, Variables, Context>
        ).successSnackBar;
    } else {
        arg1 = mutationArg;
        arg2 = snackSuccessMessage;
        arg3 = snackErrorMsg;
        arg4 = invalidateQueryKey;
        arg5 = options;
        arg6 = showSucessSnackBar;
        arg7 = ignoreErrorCodes;
        arg8 = successSnackBar;
    }
    return useBaseSnackMutation<Data, Error, Variables, Context>(
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
        arg6,
        arg7,
        arg8,
    );
};

/**
 * Mix a useQuery from react-query and snackbar message in case of error
 * @param queryKey
 * @param queryFn
 * @param snackErrorMsg
 *  Translatable Formatjs Message object. null to suppress, undefined for default.
 * @param options
 * @param {boolean} dispatchOnError
 * @returns UseQueryResult<Data, Error>;
 */

const useBaseSnackQuery = <
    QueryFnData = unknown,
    Error = unknown,
    Data = QueryFnData,
    QueryKeyExtended extends QueryKey = QueryKey,
>(
    queryKey: QueryKey,
    queryFn: QueryFunction<QueryFnData>,
    snackErrorMsg: IntlMessage | undefined = MESSAGES.defaultQueryApiSuccess,
    options: UseQueryOptions<QueryFnData, Error, Data, QueryKeyExtended> = {},
    // Give the option to not dispatch onError, to avoid multiple snackbars when re-using the query with the same query key
    dispatchOnError = true,
): UseQueryResult<Data, Error> => {
    const dispatch = useDispatch();
    const newOptions = {
        ...options,
        onError: error => {
            if (dispatchOnError) {
                dispatch(
                    enqueueSnackbar(
                        errorSnackBar(undefined, snackErrorMsg, error),
                    ),
                );
            }
            if (options.onError) {
                options.onError(error);
            }
        },
    };
    const query = useQuery(queryKey, queryFn, newOptions);
    return query;
};

type SnackQueryDict<QueryFnData, Data, QueryKeyExtended extends QueryKey> = {
    queryKey: QueryKey;
    queryFn: QueryFunction<QueryFnData>;
    snackErrorMsg?: IntlMessage;
    options?: UseQueryOptions<QueryFnData, Error, Data, QueryKeyExtended>;
    // Give the option to not dispatch onError, to avoid multiple snackbars when re-using the query with the same query key
    dispatchOnError?: boolean;
};

export const useSnackQuery = <
    QueryFnData = any,
    Error = unknown,
    Data = QueryFnData,
    QueryKeyExtended extends QueryKey = QueryKey,
>(
    queryArg: QueryKey | SnackQueryDict<QueryFnData, Data, QueryKeyExtended>,
    queryFn?: QueryFunction<QueryFnData>,
    snackErrorMsg?: IntlMessage | undefined,
    options?: UseQueryOptions<QueryFnData, Error, Data, QueryKeyExtended>,
    // Give the option to not dispatch onError, to avoid multiple snackbars when re-using the query with the same query key
    dispatchOnError?: boolean,
): UseQueryResult<Data, Error> => {
    let arg1;
    let arg2;
    let arg3;
    let arg4;
    let arg5;
    // QueryKey is either a string a readonly Array. In this case, we just pass all arguments in order
    if (typeof queryArg === 'string' || Array.isArray(queryArg)) {
        arg1 = queryArg;
        arg2 = queryFn;
        arg3 = snackErrorMsg;
        arg4 = options;
        arg5 = dispatchOnError;
    } else {
        arg1 = (queryArg as SnackQueryDict<QueryFnData, Data, QueryKeyExtended>)
            .queryKey;
        arg2 = (queryArg as SnackQueryDict<QueryFnData, Data, QueryKeyExtended>)
            .queryFn;
        arg3 = (queryArg as SnackQueryDict<QueryFnData, Data, QueryKeyExtended>)
            .snackErrorMsg;
        arg4 = (queryArg as SnackQueryDict<QueryFnData, Data, QueryKeyExtended>)
            .options;
        arg5 = (queryArg as SnackQueryDict<QueryFnData, Data, QueryKeyExtended>)
            .dispatchOnError;
    }
    return useBaseSnackQuery<QueryFnData, Error, Data, QueryKeyExtended>(
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
    );
};

/**
 * Mix a useQueries from react-query and snackbar message in case of error
 * @param queries
 */

export const useSnackQueries = <QueryFnData>(
    queries: {
        queryKey: QueryKey;
        queryFn: QueryFunction<QueryFnData>;
        snackErrorMsg?: IntlMessage;
        options: UseQueryOptions;
        dispatchOnError?: boolean;
    }[],
): Array<UseQueryResult<unknown, unknown>> => {
    const dispatch = useDispatch();
    const newQueries = queries.map(query => {
        const {
            options,
            dispatchOnError,
            snackErrorMsg = MESSAGES.defaultQueryApiSuccess,
        } = query;
        const newOptions = {
            ...options,
            onError: error => {
                if (dispatchOnError) {
                    dispatch(
                        enqueueSnackbar(
                            errorSnackBar(undefined, snackErrorMsg, error),
                        ),
                    );
                }
                if (options.onError) {
                    options.onError(error);
                }
            },
        };
        return { ...query, ...newOptions };
    });
    return useQueries<Array<UseQueryResult<unknown, unknown>>>(newQueries);
};

export const useAbortController = ():
    | AbortController
    | Record<string, never> => {
    const abortController = useRef(new AbortController());
    return abortController?.current ?? {};
};
