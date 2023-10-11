import { UseMutationResult } from 'react-query';
import { PartialBy } from 'bluesquare-components';
import {
    postRequest,
    patchRequest,
} from '../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

type QueryData = {
    id: string;
    name: string;
    // eslint-disable-next-line camelcase
    campaigns_ids: string[];
};

export type GroupedCampaignQuery = PartialBy<QueryData, 'id'>;

export const useSaveGroupedCampaign = (
    type: 'create' | 'edit',
): UseMutationResult => {
    const edit = useSnackMutation(
        (data: QueryData) =>
            patchRequest(`/api/polio/campaignsgroup/${data.id}/`, data),
        undefined,
        undefined,
        ['groupedCampaigns'],
    );
    const create = useSnackMutation(
        (data: Omit<QueryData, 'id'>) =>
            postRequest(`/api/polio/campaignsgroup/`, data),
        undefined,
        undefined,
        ['groupedCampaigns'],
    );
    return type === 'create' ? create : edit;
};
