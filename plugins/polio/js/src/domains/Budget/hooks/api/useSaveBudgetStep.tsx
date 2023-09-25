/* eslint-disable camelcase */
import { BudgetStep, LinkWithAlias } from '../../types';
import MESSAGES from '../../../../constants/messages';
import { postRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { PostArg } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';

type Payload = {
    transition_key: string; // key
    comment?: string;
    files?: File[]; // for some transitions, one of files or links will have to have a value
    links?: LinkWithAlias[];
    amount?: number;
    campaign_id: string; // uuid
};

type PostRequestBody = PostArg;

const postBudgetStep = (body: Payload): Promise<BudgetStep> => {
    const filteredParams = Object.fromEntries(
        Object.entries(body).filter(
            // eslint-disable-next-line no-unused-vars
            ([key, value]) => value !== undefined && key !== 'general',
        ),
    );
    const { links }: { links?: LinkWithAlias[] } = filteredParams;
    if (links) {
        const filteredLinks = links.filter(link => link.alias && link.url);

        filteredParams.links = filteredLinks;
    }
    const requestBody: PostRequestBody = {
        url: '/api/polio/budget/transition_to/',
        data: filteredParams,
    };
    if (body.files) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { files, ...data } = filteredParams;
        const fileData = { files: body.files };
        requestBody.data = data;
        requestBody.fileData = fileData;
    }
    return postRequest(requestBody as PostArg);
};

export const useSaveBudgetStep = () => {
    return useSnackMutation({
        mutationFn: postBudgetStep,
        invalidateQueryKey: 'budget',
        snackSuccessMessage: MESSAGES.budgetUpdated,
        showSucessSnackBar: true,
    });
};
