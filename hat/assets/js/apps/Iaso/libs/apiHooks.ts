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
export const useSnackMutation = <
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
    ignoreErrorCodes: number[] = [],
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
            if (snackSuccessMessage) {
                dispatch(
                    enqueueSnackbar(
                        succesfullSnackBar(undefined, snackSuccessMessage),
                    ),
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

export const useSnackQuery = <
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

/**
 * Mix a useQueries from react-query and snackbar message in case of error
 * @param queries
 */

export const useSnackQueries = <QueryFnData>(
    queries: {
        queryKey: QueryKey;
        queryFn: QueryFunction<QueryFnData>;
        snackErrorMsg: IntlMessage;
        options: UseQueryOptions;
        dispatchOnError: boolean;
    }[],
): UseQueryResult[] => {
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
    return useQueries(newQueries);
};

export const useAbortController = ():
    | AbortController
    | Record<string, never> => {
    const abortController = useRef(new AbortController());
    return abortController?.current ?? {};
};
