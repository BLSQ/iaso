/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
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
const postBudgetEvent = async (data: QueryData) => {
    const { files, ...body } = data;
    // const body = files
    //     ? { ...query, is_finalized: false }
    //     : { ...query, is_finalized: true };

    const newEvent = await postRequest(`/api/polio/budgetevent/`, body);
    // if !files => putRequest
    // return putRequest result
    if (files) {
        const filesData = {};
        Array.from(files).forEach((file: File) => {
            filesData[file.name] = file;
        });
        // save status
        return postRequest(
            `/api/polio/budgetfiles/`,
            { event: newEvent.id },
            filesData,
        );
        // if no file or post files status === 200
        // PutRequest: is_finalized:true
        // return putRequest result
    }
    return newEvent;
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

export const useSaveBudgetEvent = (
    type: 'create' | 'edit',
): UseMutationResult => {
    const save = useSnackMutation(postBudgetEvent, undefined, undefined, [
        'budget-details',
    ]);

    const edit = useSnackMutation(postEventFiles, undefined, undefined, [
        'budget-details',
    ]);

    return type === 'create' ? save : edit;
};
