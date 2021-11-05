import { defineMessage } from 'react-intl';
import { useSnackMutation } from 'iaso/libs/apiHooks';
import { deleteRequest } from 'iaso/libs/Api';

export const useRemoveCampaign = () =>
    useSnackMutation(
        id => deleteRequest(`/api/polio/campaigns/${id}`),
        defineMessage({
            defaultMessage: 'Campaign successfully removed',
            id: 'iaso.polio.campaign.deleteSuccess',
        }),
        defineMessage({
            defaultMessage: 'Error removing campaign',
            id: 'iaso.polio.campaign.deleteError',
        }),
        ['polio', 'campaigns'],
    );
