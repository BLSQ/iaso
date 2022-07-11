/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
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
    comments?: string;
    // status: 'validation_ongoing'; // forcing status value as we create an event
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
    useSnackMutation(
        createEvent,
        MESSAGES.budgetEventCreated,
        undefined,
        ['budget-details'],
        undefined,
        false,
    );

export const useUpdateBudgetEvent = () =>
    useSnackMutation(
        patchEvent,
        MESSAGES.budgetEventCreated,
        undefined,
        ['budget-details'],
        undefined,
        false,
    );

export const useUploadBudgetFiles = () =>
    useSnackMutation(
        postEventFiles,
        MESSAGES.budgetFilesUploaded,
        undefined,
        ['budget-details'],
        undefined,
        false,
    );

export const useFinalizeBudgetEvent = () =>
    useSnackMutation(
        putBudgetFinalisation,
        MESSAGES.budgetEventFinalized,
        undefined,
        ['budget-details'],
        undefined,
    );

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

export const useQuickValidateBudgetEvent = () => {
    const { mutateAsync: create } = useCreateBudgetEvent();
    const { mutateAsync: finalize } = useFinalizeBudgetEvent();
    return async (data: QueryData) =>
        // @ts-ignore
        create(data, {
            onSuccess: response => {
                return finalize(response.id);
            },
        });
};
