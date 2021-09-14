import { useDispatch } from 'react-redux';
import { useMutation, useQueryClient } from 'react-query';
import { enqueueSnackbar } from '../../../../../hat/assets/js/apps/Iaso/redux/snackBarsReducer';
import {
    errorSnackBar,
    succesfullSnackBar,
} from '../../../../../hat/assets/js/apps/Iaso/constants/snackBars';
import { defineMessages } from 'react-intl';

export const sendRequest = async (method, path, body) => {
    const requestInit = {
        method,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    };

    const response = await fetch(path, requestInit);

    if (!response.ok) {
        let res;
        try {
            res = await response.json();
        } catch {
            res = new Error('Api Error');
        }

        throw res;
    }

    if (response.status === 204) return;

    return await response.json();
};

const MESSAGES = defineMessages({
    defaultMutationApiError: {
        id: 'iaso.snackBar.error',
        defaultMessage: 'An error occurred while saving',
    },
    defaultMutationApiSuccess: {
        id: 'iaso.snackBar.successful',
        defaultMessage: 'Saved successfully',
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
 *   Translatable Formatjs Message object.
 *   pass null to supress, undefined for default.
 * @param snackErrorMsg
 *   idem
 * @param invalidateQueryKey
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
