import L from 'leaflet';
import { OrgUnit } from '../../../types/orgUnit';
import { Bounds, getOrgUnitBounds } from '../../../../../utils/map/mapUtils';

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
    let finalBounds;
    const groups: Record<string, any>[] = [];
    const locations: Record<string, any>[] = [];
    let shapesBounds;
    if (ancestorWithGeoJson) {
        const tempBounds = L.geoJSON(ancestorWithGeoJson.geo_json);
        shapesBounds = tempBounds.getBounds();
    }

    const locationsBounds = L.latLngBounds(locations);
    finalBounds = locationsBounds.extend(shapesBounds);

    const orgUnitBounds = getOrgUnitBounds(orgUnit);
    if (orgUnitBounds) {
        finalBounds = finalBounds.extend(orgUnitBounds);
    }
    if (orgUnit.geo_json) {
        groups.push(locationGroup.group);
    }
    if (orgUnit.catchment) {
        groups.push(catchmentGroup.group);
    }
    const group = new L.FeatureGroup(groups);
    if (orgUnit.latitude && orgUnit.longitude) {
        if (groups.length > 0) {
            const groupBounds = group.getBounds();
            finalBounds = finalBounds.extend(groupBounds);
        }
    } else if (groups.length > 0) {
        const bounds = group.getBounds();
        finalBounds = finalBounds.extend(bounds);
    }
    return finalBounds;
};
