import { useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useMutation, useQuery, useQueries, useQueryClient } from 'react-query';
import { defineMessages } from 'react-intl';
import { enqueueSnackbar } from '../redux/snackBarsReducer';
import { errorSnackBar, succesfullSnackBar } from '../constants/snackBars';

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
 * @param {function(*): Promise<*>} mutationFn
 * @param {*}  snackSuccessMessage
 * @param {string} snackSuccessMessage.id
 *   Translatable Formatjs Message object.
 *   pass null to suppress, undefined for default.
 * @param {*} snackErrorMsg
 * @param {string} snackErrorMsg.id
 *   idem
 * @param {InvalidateQueryFilters<*>|string|*[]} invalidateQueryKey
 *   optional query key to invalidate
 * @param options
 *   standard useMutation Options
 * @returns {UseMutationResult<mutationFn, options, void, unknown>}
 */
export const useSnackMutation = (
    mutationFn,
    snackSuccessMessage = MESSAGES.defaultMutationApiSuccess,
    snackErrorMsg = MESSAGES.defaultMutationApiError,
    invalidateQueryKey = undefined,
    options = {},
) => {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    const newOptions = {
        ...options,
        onError: (error, variables, context) => {
            dispatch(
                enqueueSnackbar(errorSnackBar(null, snackErrorMsg, error)),
            );
            if (options.onError) {
                return options.onError(error, variables, context);
            }
            return null;
        },
        onSuccess: (data, variables, context) => {
            if (snackSuccessMessage) {
                dispatch(
                    enqueueSnackbar(
                        succesfullSnackBar(null, snackSuccessMessage),
                    ),
                );
            }
            if (invalidateQueryKey) {
                queryClient.invalidateQueries(invalidateQueryKey);
            }
            if (options.onSuccess) {
                return options.onSuccess(data, variables, context);
            }

            return null;
        },
    };
    return useMutation(mutationFn, newOptions);
};
/**
 * Mix a useQuery from react-query and snackbar message in case of error
 * @param {string[]} queryKey
 * @param {((context: QueryFunctionContext<*>) => (Promise<TQueryFnData> | TQueryFnData))|UseQueryOptions<TQueryFnData, TError, TData, *>} queryFn
 * @param {Object|null} snackErrorMsg
 * @param {string} snackErrorMsg.id
 *  Translatable Formatjs Message object. null to suppress, undefined for default.
 * @param {UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>)} options
 * @param {boolean} dispatchOnError
 * @returns UseQueryResult<TData, TError>;
 */

export const useSnackQuery = (
    queryKey,
    queryFn,
    snackErrorMsg = MESSAGES.defaultQueryApiSuccess,
    options = {},
    // Give the option to not dispatch onError, to avoid multiple snackbars when re-using the query with the same query key
    dispatchOnError = true,
) => {
    const dispatch = useDispatch();
    const newOptions = {
        ...options,
        onError: (error, variables, context) => {
            if (dispatchOnError) {
                dispatch(
                    enqueueSnackbar(errorSnackBar(null, snackErrorMsg, error)),
                );
            }
            if (options.onError) {
                options.onError(error, variables, context);
            }
        },
    };
    const query = useQuery(queryKey, queryFn, newOptions);
    return query;
};

/**
 * Mix a useQueries from react-query and snackbar message in case of error
 * @param {Array.<
 *      queryKey: string[],
 *      queryFn: {((context: QueryFunctionContext<*>) => (Promise<TQueryFnData> | TQueryFnData))|UseQueryOptions<TQueryFnData, TError, TData, *>},
 *      snackErrorMsg: {Object|null},
 *      options: {UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>)}
 *      dispatchOnError: boolean
 * >} queries
 */

export const useSnackQueries = queries => {
    const dispatch = useDispatch();
    const newQueries = queries.map(query => {
        const {
            options,
            dispatchOnError,
            snackErrorMsg = MESSAGES.defaultQueryApiSuccess,
        } = query;
        const newOptions = {
            ...options,
            onError: (error, variables, context) => {
                if (dispatchOnError) {
                    dispatch(
                        enqueueSnackbar(
                            errorSnackBar(null, snackErrorMsg, error),
                        ),
                    );
                }
                if (options.onError) {
                    options.onError(error, variables, context);
                }
            },
        };
        return { ...query, ...newOptions };
    });
    return useQueries(newQueries);
};

export const useAbortController = () => {
    const abortController = useRef();
    useEffect(() => {
        if (!abortController.current) {
            abortController.current = new AbortController();
        }
    });
    return {
        signal: abortController.current?.signal,
        cancel: abortController.current?.cancel,
    };
};
