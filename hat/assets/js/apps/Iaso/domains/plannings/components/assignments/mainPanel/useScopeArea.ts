import { useMemo } from 'react';
import L from 'leaflet';
import { useApiMicroplanningPlanningsOrgunitsRootRetrieve } from 'Iaso/api/plannings';
import { GeoJson } from 'Iaso/components/maps/types';

type ScopeArea = {
    orgUnitId?: number;
    geoJson?: GeoJson;
    bounds?: L.LatLngBounds;
    isLoading: boolean;
};

// Sub-team areas need the assignment scope API: until then, every team keeps the root area.
export const useScopeArea = (planningId: string): ScopeArea => {
    const { data: rootOrgUnit, isLoading } =
        useApiMicroplanningPlanningsOrgunitsRootRetrieve(planningId);
    // The generated schema types geo_json as a string, the API returns a GeoJSON object.
    const geoJson = rootOrgUnit?.geo_json as unknown as GeoJson | undefined;
    const bounds = useMemo(
        () => (geoJson ? L.geoJSON(geoJson).getBounds() : undefined),
        [geoJson],
    );
    return { orgUnitId: rootOrgUnit?.id, geoJson, bounds, isLoading };
};
