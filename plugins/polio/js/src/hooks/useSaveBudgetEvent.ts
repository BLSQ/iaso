/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

type QueryData = {
    campaign: string;
    type: 'comments' | 'submission';
    target_teams: number[];
    cced_emails?: string;
    comments?: string;
    status: 'validation_ongoing'; // forcing status value as we create an event
    files: any;
};
const postBudgetEvent = async (data: QueryData) => {
    const { files, ...body } = data;
    const newEvent = await postRequest(`/api/polio/budgetevent/`, body);
    if (files) {
        const filesToUpload = Array.from(files).map(file => {
            return postRequest(
                `/api/polio/budgetfiles/`,
                { event: newEvent.id },
                {
                    file,
                },
            );
        });
        const uploadStatuses = await Promise.allSettled(filesToUpload);
        // TODO add error handling when a file does not upload
        console.log('promises', filesToUpload);
        console.log('statuses', uploadStatuses);
    }
    return newEvent;
};
export const useSaveBudgetEvent = (): UseMutationResult => {
    return useSnackMutation(postBudgetEvent, undefined, undefined, [
        'budget-details',
    ]);
};
