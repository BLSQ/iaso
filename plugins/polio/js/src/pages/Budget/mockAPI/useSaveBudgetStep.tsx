/* eslint-disable camelcase */
import { useSnackMutation } from '../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { BudgetStep } from './useGetBudgetDetails';
import MESSAGES from '../../../constants/messages';
import { postRequest } from '../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

type Payload = {
    transition_key: string; // key
    comment?: string;
    files?: File[]; // for some transitions, one of files or links will have to have a value
    links?: { alias: string; url: string }[];
    amount?: number;
    campaign_id: string; // uuid
};

// const postMockBudgetStep = async (body: Payload): Promise<BudgetStep> => {
//     await waitFor(1000);
//     return {
//         id: 5,
//         created_at: '2022-10-04T16:14:08.957908Z',
//         created_by: 'Marty McFly',
//         created_by_team: 'Team McFly',
//         comment: body?.comment,
//         links: body?.links,
//         amount: body?.amount,
//         transition_key: body.transition_key,
//         transition_label: body.transition_key, // using key for the time being
//     };
// };

export type PostRequestBody = {
    url: string;
    data: Record<string, any>;
    fileData?: Record<string, File>[];
};

const postBudgetStep = (body: Payload): Promise<BudgetStep> => {
    const filteredParams = Object.fromEntries(
        Object.entries(body).filter(
            // eslint-disable-next-line no-unused-vars
            ([key, value]) => value !== undefined && key !== 'general',
        ),
    );
    const requestBody: PostRequestBody = {
        url: '/api/polio/budget/transition_to/',
        data: filteredParams,
    };
    if (body.files) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { files, ...data } = filteredParams;
        const fileData = body.files.map(file => {
            return { [file.name as string]: file };
        });
        requestBody.data = data;
        requestBody.fileData = fileData;
    }
    return postRequest(requestBody);
};

export const useSaveBudgetStep = () => {
    return useSnackMutation({
        mutationFn: postBudgetStep,
        invalidateQueryKey: 'budget',
        snackSuccessMessage: MESSAGES.budgetEventCreated,
        showSucessSnackBar: false,
    });
};
