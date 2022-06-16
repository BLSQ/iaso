/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { BudgetEventType } from '../constants/types';

type QueryData = {
    campaign: string;
    type: BudgetEventType;
    target_teams: number[];
    comments?: string;
    status: 'validation_ongoing'; // forcing status value as we create an event
    files: FileList;
};
const postBudgetEvent = async (data: QueryData) => {
    const { files, ...body } = data;
    const newEvent = await postRequest(`/api/polio/budgetevent/`, body);
    if (files) {
        const filesData = {};
        Array.from(files).forEach((file: File) => {
            filesData[file.name] = file;
        });
        return postRequest(
            `/api/polio/budgetfiles/`,
            { event: newEvent.id },
            filesData,
        );
    }
    return newEvent;
};
export const useSaveBudgetEvent = (): UseMutationResult => {
    return useSnackMutation(postBudgetEvent, undefined, undefined, [
        'budget-details',
    ]);
};
