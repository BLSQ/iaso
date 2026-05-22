import { useMemo } from 'react';
import { CampaignFormValues, Round } from '../../../../../constants/types';
import { useGetParentOrgUnit } from '../../../Scope/hooks/useGetParentOrgUnit';
import { useGetGeoJson } from '../../../Scope/hooks/useGetGeoJson';

export const useGetSubActivityShapes = (
    campaign: CampaignFormValues,
    round?: Round,
) => {
    const roundScopes = useMemo(() => {
        if (!campaign.separate_scopes_per_round) {
            return campaign.scopes.map(scope => scope.group.org_units).flat();
        }
        if (round?.scopes) {
            return round.scopes.map(scope => scope.group.org_units).flat();
        }
        return [];
    }, [campaign.scopes, campaign.separate_scopes_per_round, round?.scopes]);

    const { data: country } = useGetParentOrgUnit(campaign.initial_org_unit);

    const parentCountryId =
        country?.country_parent?.id || country?.root?.id || country?.id;

    const { data: districtShapes, isFetching: isFetchingDistricts } =
        useGetGeoJson({
            topParentId: parentCountryId,
            orgUnitCategory: 'DISTRICT',
        });
    const { data: regionShapes, isFetching: isFetchingRegions } = useGetGeoJson(
        { topParentId: parentCountryId, orgUnitCategory: 'REGION' },
    );

    const districtShapesForSubActivity = districtShapes?.filter(shape =>
        roundScopes.includes(shape.id),
    );
    const regionShapesForSubActivity = regionShapes?.filter(shape =>
        (districtShapesForSubActivity ?? []).some(
            district => district.parent_id === shape.id,
        ),
    );

    return useMemo(() => {
        return {
            districtShapes: districtShapesForSubActivity,
            regionShapes: regionShapesForSubActivity,
            isFetchingRegions,
            isFetchingDistricts,
        };
    }, [
        districtShapesForSubActivity,
        isFetchingDistricts,
        isFetchingRegions,
        regionShapesForSubActivity,
    ]);
};
