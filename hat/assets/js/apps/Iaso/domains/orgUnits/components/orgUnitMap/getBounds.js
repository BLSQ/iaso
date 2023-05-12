import L from 'leaflet';

const getBounds = ({
    orgUnit,
    locationGroup,
    catchmentGroup,
    ancestorWithGeoJson,
}) => {
    let otherBounds;
    const groups = [];
    const locations = [];
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
export default getBounds;
