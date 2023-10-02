import { defineMessage } from 'react-intl';
import { useSnackMutation } from 'Iaso/libs/apiHooks.ts';
import { deleteRequest } from 'Iaso/libs/Api';

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
