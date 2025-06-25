import L from 'leaflet';
import { Bounds, getOrgUnitBounds } from '../../../../../utils/map/mapUtils';
import { OrgUnit } from '../../../types/orgUnit';

type Props = {
    orgUnit: OrgUnit;
    locationGroup: Record<string, any>;
    catchmentGroup: Record<string, any>;
    ancestorWithGeoJson?: OrgUnit;
};

export const useGetBounds = ({
    orgUnit,
    locationGroup,
    catchmentGroup,
    ancestorWithGeoJson,
}: Props): Bounds | undefined => {
    const groups: Record<string, any>[] = [];
    const locations: Record<string, any>[] = [];

    // Initialize with undefined - we'll build bounds progressively
    let finalBounds: L.LatLngBounds | undefined;

    // Handle ancestor geo JSON bounds
    if (ancestorWithGeoJson?.geo_json) {
        try {
            const tempBounds = L.geoJSON(ancestorWithGeoJson.geo_json);
            const shapesBounds = tempBounds.getBounds();
            if (shapesBounds && shapesBounds.isValid()) {
                finalBounds = shapesBounds;
            }
        } catch (error) {
            console.warn('Error parsing ancestor geo JSON:', error);
        }
    }

    // Handle locations bounds - only if we have actual locations
    if (locations.length > 0) {
        const locationsBounds = L.latLngBounds(locations);
        if (locationsBounds && locationsBounds.isValid()) {
            if (finalBounds) {
                finalBounds = finalBounds.extend(locationsBounds);
            } else {
                finalBounds = locationsBounds;
            }
        }
    }

    // Handle org unit bounds
    const orgUnitBounds = getOrgUnitBounds(orgUnit);
    if (orgUnitBounds && orgUnitBounds.isValid()) {
        if (finalBounds) {
            finalBounds = finalBounds.extend(orgUnitBounds);
        } else {
            finalBounds = orgUnitBounds;
        }
    }

    // Handle groups
    if (orgUnit.geo_json) {
        groups.push(locationGroup.group);
    }
    if (orgUnit.catchment) {
        groups.push(catchmentGroup.group);
    }

    if (groups.length > 0) {
        const group = new L.FeatureGroup(groups);
        try {
            const groupBounds = group.getBounds();
            if (groupBounds && groupBounds.isValid()) {
                if (finalBounds) {
                    finalBounds = finalBounds.extend(groupBounds);
                } else {
                    finalBounds = groupBounds;
                }
            }
        } catch (error) {
            console.warn('Error getting group bounds:', error);
        }
    }

    // Return undefined if no valid bounds were found
    return finalBounds && finalBounds.isValid() ? finalBounds : undefined;
};
