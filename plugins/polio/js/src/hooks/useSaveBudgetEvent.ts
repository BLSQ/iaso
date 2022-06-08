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
    file: any;
};
const postBudgetEvent = async (data: QueryData) => {
    const { file, ...body } = data;
    const newEvent = await postRequest(`/api/polio/budgetevent/`, body);
    return postRequest(
        `/api/polio/budgetfiles/`,
        { event: newEvent.id },
        {
            file,
        },
    );
};
export const useSaveBudgetEvent = (): // type: 'create' | 'edit',
UseMutationResult => {
    // const edit = useSnackMutation(
    //     (data: QueryData) =>
    //         patchRequest(`/api/polio/campaignsgroup/${data.id}/`, data),
    //     undefined,
    //     undefined,
    //     ['groupedCampaigns'],
    // );
    const create = useSnackMutation(postBudgetEvent, undefined, undefined, [
        'budget-details',
    ]);
    // return type === 'create' ? create : edit;
    return create;
};
