import L from 'leaflet';
import { OrgUnit } from '../../../types/orgUnit';
import { Bounds } from '../../../../../utils/map/mapUtils';

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
    let otherBounds;
    const groups: Record<string, any>[] = [];
    const locations: Record<string, any>[] = [];
    let shapesBounds;
    if (ancestorWithGeoJson) {
        const tempBounds = L.geoJSON(ancestorWithGeoJson.geo_json);
        shapesBounds = tempBounds.getBounds();
    }

    const locationsBounds = L.latLngBounds(locations);
    otherBounds = locationsBounds.extend(shapesBounds);
    if (orgUnit.geo_json) {
        groups.push(locationGroup.group);
    }
    if (orgUnit.catchment) {
        groups.push(catchmentGroup.group);
    }
    const group = new L.FeatureGroup(groups);
    if (orgUnit.latitude && orgUnit.longitude) {
        const latlng = [L.latLng(orgUnit.latitude, orgUnit.longitude)];
        let bounds = L.latLngBounds(latlng);
        if (groups.length > 0) {
            const groupBounds = group.getBounds();
            bounds = groupBounds.extend(bounds);
        }
        otherBounds = otherBounds.extend(bounds);
    } else if (groups.length > 0) {
        const bounds = group.getBounds();
        otherBounds = otherBounds.extend(bounds);
    }
    return otherBounds;
};
