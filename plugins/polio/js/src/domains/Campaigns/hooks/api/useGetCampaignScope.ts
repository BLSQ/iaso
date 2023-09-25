import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

export const useGetCampaignScope = ({ country, campaignId }) => {
    return useSnackQuery(
        ['polio', 'campaigns', country, campaignId],
        () => getRequest(`/api/polio/campaigns/?country__id__in=${country}`),
        undefined,
        {
            select: data => {
                const selectedCampaign = data?.find(
                    campaign => campaign.id === campaignId,
                );
                if (!selectedCampaign.separate_scopes_per_round) {
                    return (
                        (selectedCampaign?.scopes &&
                            selectedCampaign.scopes
                                .filter(scope => scope.group)
                                .map(scope => scope.group.org_units)
                                .flat()) ??
                        []
                    );
                }
                return selectedCampaign.rounds
                    .map(round =>
                        round.scopes
                            .filter(scope => scope.group)
                            .map(scope => scope.group.org_units)
                            .flat(),
                    )
                    .flat();
            },
        },
    );
};
