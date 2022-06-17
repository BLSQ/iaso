/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import {
    patchRequest,
    postRequest,
    putRequest,
} from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { BudgetEventType } from '../constants/types';

type QueryData = {
    id?: number;
    campaign: string;
    type: BudgetEventType;
    target_teams: number[];
    comments?: string;
    status: 'validation_ongoing'; // forcing status value as we create an event
    files: FileList;
};
const createEvent = async (data: QueryData) => {
    const { _files, ...body } = data;
    // create new budget event
    return postRequest(`/api/polio/budgetevent/`, body);
};
const patchEvent = async (data: QueryData) => {
    const { _files, ...body } = data;
    // create new budget event
    return patchRequest(`/api/polio/budgetevent/${data.id}`, body);
};

const postBudgetEvent = async (data: QueryData) => {
    const { files, ...body } = data;
    // create new budget event
    const newEvent = await postRequest(`/api/polio/budgetevent/`, body);

    if (files) {
        const filesData = {};
        Array.from(files).forEach((file: File) => {
            filesData[file.name] = file;
        });
        // sending files if any
        await postRequest(
            `/api/polio/budgetfiles/`,
            { event: newEvent.id },
            filesData,
        );
    }
    // when event is created and files sent, finalize event so it can be shown
    return putRequest(`api/polio/budgetevent/confirm_budget/${newEvent.id}`, {
        is_finalized: true,
    });
};

const pachBudgetEvent = async (data: QueryData) => {
    if (!data.id) throw new Error('Budget event id required');
    const { files, ...body } = data;
    // create new budget event
    const newEvent = await patchRequest(
        `/api/polio/budgetevent/${data.id}`,
        body,
    );

    if (files) {
        const filesData = {};
        Array.from(files).forEach((file: File) => {
            filesData[file.name] = file;
        });
        // sending files if any
        await patchRequest(
            `/api/polio/budgetfiles/`,
            { event: data.id },
            filesData,
        );
    }
    // when event is created and files sent, finalize event so it can be shown
    return putRequest(`/api/polio/budgetevent/confirm_budget/${newEvent.id}`, {
        is_finalized: true,
    });
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
    // return putRequest(`api/polio/budgetevent/confirm_budget/${data.id}`, {
    //     is_finalized: true,
    // });
};

const putBudgetFinalisation = async (id: number) =>
    putRequest(`/api/polio/budgetevent/confirm_budget/${id}`, {
        is_finalized: true,
    });

export const useCreateBudgetEvent = () =>
    useSnackMutation(
        createEvent,
        undefined,
        undefined,
        ['budget-details'],
        undefined,
        false,
    );

export const useUpdateBudgetEvent = () =>
    useSnackMutation(
        patchEvent,
        undefined,
        undefined,
        ['budget-details'],
        undefined,
        false,
    );

export const useUploadBudgetFiles = () =>
    useSnackMutation(postEventFiles, undefined, undefined, ['budget-details']);

export const useFinalizeBudgetEvent = () =>
    useSnackMutation(putBudgetFinalisation, undefined, undefined, [
        'budget-details',
    ]);
// export const useSaveBudgetEvent = (
//     type: 'create' | 'edit' | 'retry',
// ): UseMutationResult => {
//     const createBudgetEvent = useSnackMutation(
//         postBudgetEvent,
//         undefined,
//         undefined,
//         ['budget-details'],
//     );

//     const uploadFiles = useSnackMutation(postEventFiles, undefined, undefined, [
//         'budget-details',
//     ]);

//     return type === 'create' ? createBudgetEvent : uploadFiles;
// };
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
