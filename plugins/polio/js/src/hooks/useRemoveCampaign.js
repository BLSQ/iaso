import { defineMessage } from 'react-intl';
import { useSnackMutation } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { deleteRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';

export const useRemoveCampaign = () => {
    useSnackMutation(
        id => deleteRequest(`/api/polio/campaigns/${id}`),
        defineMessage({
            defaultMessage: 'Campaign successfully removed',
            id: 'polio.campaign.deleteSuccess',
        }),
        defineMessage({
            defaultMessage: 'Error removing campaign',
            id: 'polio.campaign.deleteError',
        }),
        ['polio', 'campaigns'],
    );
};
