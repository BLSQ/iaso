/* eslint-disable camelcase */
import { useMemo } from 'react';
import {
    useSnackMutation,
    useSnackQuery,
} from '../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { Paginated } from '../../../../../../../hat/assets/js/apps/Iaso/types/table';
import { waitFor } from '../../../../../../../hat/assets/js/apps/Iaso/utils';
import { getApiParamDateString } from '../../../../../../../hat/assets/js/apps/Iaso/utils/dates';
import { makePaginatedResponse, pageOneTemplate } from './utils';
import { Nullable } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { BudgetStep } from './useGetBudgetDetails';
import MESSAGES from '../../../constants/messages';

type Payload = {
    transition_key: string; // key
    comment?: string;
    files?: File[]; // for some transitions, one of files or links will have to have a value
    links?: string[];
    amount?: number;
    campaign_id: string; // uuid
};

const postBudgetStep = async (body: Payload): Promise<BudgetStep> => {
    await waitFor(1000);
    return {
        created_at: '2022-10-04T16:14:08.957908Z',
        created_by: 'Marty McFly',
        created_by_team: 'Team McFly',
        comment: body?.comment,
        links: body?.links,
        amount: body?.amount,
        transition_key: body.transition_key,
        transition_label: body.transition_key, // using key for the time being
    };
};

export const useSaveBudgetStep = () => {
    return useSnackMutation({
        mutationFn: postBudgetStep,
        invalidateQueryKey: 'budget',
        snackSuccessMessage: MESSAGES.budgetEventCreated,
        showSucessSnackBar: false,
    });
};
