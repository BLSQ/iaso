import { UseMutationResult } from 'react-query';
import {
    postRequest,
    putRequest,
} from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { PartialBy } from '../../../../../hat/assets/js/apps/Iaso/types/utils';

type QueryData = {
    id: string;
    name: string;
    campaigns: string[];
};

export type GroupedCampaignQuery = PartialBy<QueryData, 'id'>;

export const useSaveGroupedCampaign = (
    type: 'create' | 'edit',
): UseMutationResult => {
    const edit = useSnackMutation((data: QueryData) =>
        putRequest(`/api/campaignsgroup/${data.id}`, data),
    );
    const create = useSnackMutation((data: Omit<QueryData, 'id'>) =>
        postRequest(`/api/campaignsgroup/`, data),
    );
    return type === 'create' ? create : edit;
};
