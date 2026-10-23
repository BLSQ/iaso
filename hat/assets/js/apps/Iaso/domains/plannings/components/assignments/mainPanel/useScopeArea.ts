import { useMemo } from 'react';
import { FeatureCollection } from 'geojson';
import { LngLatBounds } from 'maplibre-gl';
import { useApiMicroplanningPlanningsOrgunitsRootRetrieve } from 'Iaso/api/plannings';
import { getGeoJsonBounds } from 'Iaso/components/maps/maplibre/utils';

type ScopeArea = {
    geoJson?: FeatureCollection;
    bounds?: LngLatBounds;
    isLoading: boolean;
};

// Sub-team areas need the assignment scope API: until then, every team keeps the root area.
export const useScopeArea = (planningId: string): ScopeArea => {
    const { data: rootOrgUnit, isLoading } =
        useApiMicroplanningPlanningsOrgunitsRootRetrieve(planningId);
    // The generated schema types geo_json as a string, the API returns a GeoJSON object.
    const geoJson = rootOrgUnit?.geo_json as unknown as
        | FeatureCollection
        | undefined;
    const bounds = useMemo(
        () => (geoJson ? getGeoJsonBounds(geoJson) : undefined),
        [geoJson],
    );
    return { geoJson, bounds, isLoading };
};
