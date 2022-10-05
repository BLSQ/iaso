/* eslint-disable camelcase */
import { UseMutationResult, useQueryClient } from 'react-query';
import {
    patchRequest,
    postRequest,
    putRequest,
} from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { BudgetEventType } from '../constants/types';
import MESSAGES from '../constants/messages';

export type QueryData = {
    id?: number;
    campaign: string;
    type: BudgetEventType;
    target_teams: number[];
    comment?: string;
    files?: FileList;
};
const createEvent = async (data: QueryData) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { files, ...body } = data;
    // create new budget event
    return postRequest(`/api/polio/budgetevent/`, body);
};
const patchEvent = async (data: QueryData) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { files, ...body } = data;
    // create new budget event
    return patchRequest(`/api/polio/budgetevent/${data.id}/`, body);
};

const postEventFiles = async (data: QueryData) => {
    if (!data.id) throw new Error('event id required');
    if (!data.files) throw new Error('Files required');
    const { files } = data;
    const filesData = {};
    Array.from(files).forEach((file: File) => {
        filesData[file.name] = file;
    });
    return postRequest(
        `/api/polio/budgetfiles/`,
        { event: data.id },
        filesData,
    );
};

const putBudgetFinalisation = async (id: number) => {
    return putRequest(`/api/polio/budgetevent/confirm_budget/`, {
        is_finalized: true,
        event: id,
    });
};

export const useCreateBudgetEvent = () =>
    useSnackMutation({
        mutationFn: createEvent,
        snackSuccessMessage: MESSAGES.budgetEventCreated,
        invalidateQueryKey: ['budget-details'],
        showSucessSnackBar: false,
        ignoreErrorCodes: [400],
    });
// We don't need to invalidate the key here since the call to finalize will be called onSuccess in CreateEditBudgetEvent and will invalidate the key onSuccess.
// There's no need to invalidate the key onError, since nothing will have changed then
export const useUpdateBudgetEvent = () =>
    useSnackMutation({
        mutationFn: patchEvent,
        snackSuccessMessage: MESSAGES.budgetEventCreated,
        showSucessSnackBar: false,
        ignoreErrorCodes: [400],
    });

// We don't invalidate the 'budget-details query key when uploading file, otherwise , the onSuccess call in CreateEditBudgetEvent gets short-circuited, and the call to finalize is not sent
export const useUploadBudgetFiles = () =>
    useSnackMutation({
        mutationFn: postEventFiles,
        snackSuccessMessage: MESSAGES.budgetFilesUploaded,
        showSucessSnackBar: false,
        ignoreErrorCodes: [400],
    });

export const useFinalizeBudgetEvent = () => {
    const queryClient = useQueryClient();
    return useSnackMutation({
        mutationFn: putBudgetFinalisation,
        snackSuccessMessage: MESSAGES.budgetEventFinalized,
        invalidateQueryKey: ['budget-details'],
        ignoreErrorCodes: [400],
        // Since staleTime for ['teams'] is Infinity, we invalidate the cache when an event has been created to refresh the teams list
        options: {
            onSettled: () => {
                queryClient.invalidateQueries(['teams']);
            },
        },
    });
};

export const useSaveBudgetEvent = (
    type: 'create' | 'edit' | 'retry',
): UseMutationResult => {
    const createBudgetEvent = useCreateBudgetEvent();
    const updateBudgetEvent = useUpdateBudgetEvent();
    const uploadFiles = useUploadBudgetFiles();

    if (type === 'edit') return uploadFiles;
    if (type === 'retry') return updateBudgetEvent;
    return createBudgetEvent;
};
