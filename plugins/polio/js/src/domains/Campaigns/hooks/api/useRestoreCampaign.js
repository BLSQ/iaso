import { defineMessage } from 'react-intl';
import { useSnackMutation } from 'Iaso/libs/apiHooks.ts';
import { patchRequest } from 'Iaso/libs/Api';

export const useRestoreCampaign = () =>
    useSnackMutation(
        id =>
            patchRequest('/api/polio/campaigns/restore_deleted_campaigns/', {
                id,
            }),
        defineMessage({
            defaultMessage: 'Campaign successfully restored',
            id: 'iaso.polio.campaign.restoreSuccess',
        }),
        defineMessage({
            defaultMessage: 'Error restoring campaign',
            id: 'iaso.polio.campaign.restoreError',
        }),
        ['polio', 'campaigns'],
    );
